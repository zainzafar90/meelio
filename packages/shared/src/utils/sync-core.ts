import type { EntityType, SyncOperation } from "../stores/sync.store";
import { useSyncStore } from "../stores/sync.store";
import { lwwMergeById } from "./sync.utils";

export type BulkResult<T> = {
  created: Array<T & { clientId?: string }>;
  updated: T[];
  deleted: string[];
};

export interface DexieTableLike<T> {
  get: (key: string) => Promise<T | undefined>;
  add: (item: T) => Promise<any>;
  put: (item: T) => Promise<any>;
  bulkAdd: (items: T[]) => Promise<any>;
  bulkPut: (items: T[]) => Promise<any>;
  update: (key: string, changes: Partial<T>) => Promise<number>;
  delete: (key: string) => Promise<void>;
  where: (index: string) => {
    equals: (value: any) => { toArray: () => Promise<T[]> };
  };
  clear?: () => Promise<any>;
}

export interface EntityAdapter<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload> {
  entityKey: EntityType;
  dbTable: DexieTableLike<LocalT>;
  api: {
    bulkSync: (payload: {
      creates?: CreatePayload[];
      updates?: UpdatePayload[];
      deletes?: DeletePayload[];
    }) => Promise<BulkResult<RemoteT>>;
    fetchAll: () => Promise<RemoteT[]>;
  };
  transformers: {
    normalizeFromServer: (remote: RemoteT) => LocalT;
    toCreatePayload: (op: SyncOperation) => CreatePayload | null;
    toUpdatePayload: (op: SyncOperation) => UpdatePayload | null;
    toDeletePayload: (op: SyncOperation) => DeletePayload | null;
  };
  store: {
    getUserId: () => string | undefined;
    getItems: () => LocalT[];
    setItems: (items: LocalT[]) => void;
  };
  options?: {
    autoSync?: boolean;
    syncInterval?: number;
    enableOptimisticUpdates?: boolean;
  };
}

export class EntitySyncManager<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload> {
  private adapter: EntityAdapter<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>;
  private isProcessing = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;

  constructor(adapter: EntityAdapter<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>) {
    this.adapter = adapter;
    
    if (adapter.options?.autoSync) {
      this.startAutoSync(adapter.options.syncInterval || 3600000); // default 1 hour
    }
  }

  private startAutoSync(interval: number) {
    this.stopAutoSync();
    this.autoSyncInterval = setInterval(() => {
      this.processQueue();
    }, interval);
  }

  private stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    const sync = useSyncStore.getState();
    const queue = sync.getQueue(this.adapter.entityKey);
    const shouldSync = queue.length > 0 && sync.isOnline;
    if (!shouldSync) return;

    this.isProcessing = true;
    sync.setSyncing(this.adapter.entityKey, true);

    // Build bulk payload via adapters
    const creates: CreatePayload[] = [];
    const updates: UpdatePayload[] = [];
    const deletes: DeletePayload[] = [];
    
    for (const op of queue) {
      if (op.type === "create") {
        const payload = this.adapter.transformers.toCreatePayload(op);
        if (payload) creates.push(payload);
      } else if (op.type === "update") {
        const payload = this.adapter.transformers.toUpdatePayload(op);
        if (payload) updates.push(payload);
      } else if (op.type === "delete") {
        const payload = this.adapter.transformers.toDeletePayload(op);
        if (payload) deletes.push(payload);
      }
    }

    try {
      const result = await this.adapter.api.bulkSync({ creates, updates, deletes });

      // Apply the sync results
      await this.applySyncResults(result, queue);
      
      // Clear the processed queue
      for (const op of queue) {
        sync.removeFromQueue(this.adapter.entityKey, op.id);
      }
    } catch (err) {
      console.error(`${this.adapter.entityKey} bulk sync failed:`, err);
      // leave queue for retry
    } finally {
      sync.setSyncing(this.adapter.entityKey, false);
      sync.setLastSyncTime(this.adapter.entityKey, Date.now());
      this.isProcessing = false;
    }
  }

  private async applySyncResults(
    result: BulkResult<RemoteT>,
    queue: SyncOperation[]
  ): Promise<void> {
    const idMap = new Map<string, string>();
    
    // Map clientId -> server id for created items
    for (const created of result.created) {
      const anyCreated = created as any;
      if (anyCreated.clientId && anyCreated.id && anyCreated.id !== anyCreated.clientId) {
        idMap.set(anyCreated.clientId, anyCreated.id);
      }
    }

    // Apply created items
    for (const created of result.created) {
      const anyCreated = created as any;
      if (anyCreated.clientId && anyCreated.id && anyCreated.id !== anyCreated.clientId) {
        try {
          await this.adapter.dbTable.delete(anyCreated.clientId);
        } catch {}
        const normalized = this.adapter.transformers.normalizeFromServer(created);
        await this.adapter.dbTable.add(normalized);

        // Update in-memory state
        const list = this.adapter.store.getItems();
        const replaced = list.map((item: any) =>
          item.id === anyCreated.clientId ? { ...normalized, id: anyCreated.id } : item
        );
        this.adapter.store.setItems(replaced);
      }
    }

    // Apply updates
    if (result.updated?.length) {
      const normalizedUpdates = result.updated.map(this.adapter.transformers.normalizeFromServer);
      await this.adapter.dbTable.bulkPut(normalizedUpdates as any);

      // Update in-memory state to reflect any server-side resolutions
      const updatesById = new Map<string, any>();
      for (const u of normalizedUpdates as any[]) {
        if (u && u.id) updatesById.set(u.id, u);
      }
      if (updatesById.size > 0) {
        const current = this.adapter.store.getItems() as any[];
        const merged = current.map((item) =>
          item && item.id && updatesById.has(item.id)
            ? { ...item, ...updatesById.get(item.id) }
            : item
        );
        this.adapter.store.setItems(merged as any);
      }
    }

    // Apply deletions (tombstone)
    for (const id of result.deleted || []) {
      await this.adapter.dbTable.update(id as any, { 
        deletedAt: Date.now(), 
        updatedAt: Date.now() 
      } as any);
    }

    // Remove deleted items from in-memory state
    if ((result.deleted?.length || 0) > 0) {
      const deletedSet = new Set<string>(result.deleted as any);
      const current = this.adapter.store.getItems() as any[];
      const remaining = current.filter((item) => !(item && item.id && deletedSet.has(item.id)));
      this.adapter.store.setItems(remaining as any);
    }
  }

  async syncWithServer(): Promise<void> {
    const userId = this.adapter.store.getUserId();
    if (!userId) return;

    const sync = useSyncStore.getState();
    try {
      // Process any pending queue items first
      await this.processQueue();

      // Fetch all remote data
      const remoteAll = await this.adapter.api.fetchAll();
      const normalizedRemote = remoteAll.map(this.adapter.transformers.normalizeFromServer);

      // Mark local-only items as deleted (server is source of truth)
      const remoteIdSet = new Set<string>((normalizedRemote as any[]).map((r) => r.id));
      const local = await this.adapter.dbTable.where("userId").equals(userId).toArray();
      
      for (const item of local as any[]) {
        if (!item.deletedAt && item.id && !remoteIdSet.has(item.id)) {
          await this.adapter.dbTable.update(item.id, { 
            deletedAt: Date.now(), 
            updatedAt: Date.now() 
          } as any);
          (item as any).deletedAt = Date.now();
          (item as any).updatedAt = Date.now();
        }
      }

      // Merge local and remote using Last Write Wins
      const merged = lwwMergeById<any>(local as any, normalizedRemote as any);

      // Update database with merged data
      await this.adapter.dbTable.bulkPut(merged);

      // Update in-memory state (exclude deleted items)
      const active = merged.filter((x) => !x.deletedAt);
      this.adapter.store.setItems(active);

      sync.setSyncing(this.adapter.entityKey, false);
      sync.setLastSyncTime(this.adapter.entityKey, Date.now());
    } catch (e) {
      console.error(`${this.adapter.entityKey} syncWithServer failed:`, e);
      sync.setSyncing(this.adapter.entityKey, false);
    }
  }

  dispose() {
    this.stopAutoSync();
  }
}

export function createEntitySync<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>(
  adapter: EntityAdapter<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>
): EntitySyncManager<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload> {
  return new EntitySyncManager(adapter);
}

// Helper function to create standard payload transformers
export function createStandardTransformers<T extends { id: string }>() {
  return {
    toCreatePayload: (op: SyncOperation) => {
      if (op.type !== "create") return null;
      return {
        clientId: op.entityId,
        ...op.data
      };
    },
    toUpdatePayload: (op: SyncOperation) => {
      if (op.type !== "update") return null;
      return {
        id: op.entityId,
        clientId: op.entityId,
        ...op.data
      };
    },
    toDeletePayload: (op: SyncOperation) => {
      if (op.type !== "delete") return null;
      return {
        id: op.entityId,
        clientId: op.entityId,
        deletedAt: op.data?.deletedAt
      };
    }
  };
}

