import type { EntityType, SyncOperation } from "../stores/sync.store";
import { useSyncStore } from "../stores/sync.store";
import { lwwMergeById } from "./sync.utils";

type BulkResult<T> = {
  created: Array<T & { clientId?: string }>;
  updated: T[];
  deleted: string[];
};

export interface EntitySyncConfig<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload> {
  entityKey: EntityType;
  // Dexie Table-like interface (we only use the methods below)
  dbTable: {
    get: (key: string) => Promise<LocalT | undefined>;
    add: (item: LocalT) => Promise<any>;
    put: (item: LocalT) => Promise<any>;
    bulkAdd: (items: LocalT[]) => Promise<any>;
    bulkPut: (items: LocalT[]) => Promise<any>;
    update: (key: string, changes: Partial<LocalT>) => Promise<number>;
    delete: (key: string) => Promise<void>;
    where: (index: string) => {
      equals: (value: any) => { toArray: () => Promise<LocalT[]> };
    };
    clear?: () => Promise<any>;
  };
  bulkSync: (payload: {
    creates?: CreatePayload[];
    updates?: UpdatePayload[];
    deletes?: DeletePayload[];
  }) => Promise<BulkResult<RemoteT>>;
  fetchAll: () => Promise<RemoteT[]>;
  normalizeFromServer: (remote: RemoteT) => LocalT;
  toCreatePayload: (op: SyncOperation) => CreatePayload | null;
  toUpdatePayload: (op: SyncOperation) => UpdatePayload | null;
  toDeletePayload: (op: SyncOperation) => DeletePayload | null;
  getUserId: () => string | undefined;
  inMemorySelector: () => LocalT[];
  inMemorySetter: (list: LocalT[]) => void;
}

export function createEntitySync<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>(
  config: EntitySyncConfig<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>
) {
  const { entityKey } = config;
  let isProcessing = false;

  async function processQueue(): Promise<void> {
    if (isProcessing) return;

    const sync = useSyncStore.getState();
    const queue = sync.getQueue(entityKey);
    const shouldSync = queue.length > 0 && sync.isOnline;
    if (!shouldSync) return;

    isProcessing = true;
    sync.setSyncing(entityKey, true);

    // Build bulk payload via adapters
    const creates: CreatePayload[] = [];
    const updates: UpdatePayload[] = [];
    const deletes: DeletePayload[] = [];
    for (const op of queue) {
      if (op.type === "create") {
        const payload = config.toCreatePayload(op);
        if (payload) creates.push(payload);
      } else if (op.type === "update") {
        const payload = config.toUpdatePayload(op);
        if (payload) updates.push(payload);
      } else if (op.type === "delete") {
        const payload = config.toDeletePayload(op);
        if (payload) deletes.push(payload);
      }
    }

    try {
      const result = await config.bulkSync({ creates, updates, deletes });

      // Map clientId -> server id for created
      const idMap = new Map<string, string>();
      for (const c of result.created) {
        const anyC = c as any;
        if (anyC.clientId && anyC.id && anyC.id !== anyC.clientId) {
          idMap.set(anyC.clientId, anyC.id);
        }
      }

      // Apply results: created, updated, deleted
      // Created: replace temporary clientId rows with server rows
      for (const created of result.created) {
        const anyCreated = created as any;
        if (anyCreated.clientId && anyCreated.id && anyCreated.id !== anyCreated.clientId) {
          try {
            await config.dbTable.delete(anyCreated.clientId);
          } catch {}
          const normalized = config.normalizeFromServer(created);
          await config.dbTable.add(normalized);

          // Update in-memory state (replace by clientId)
          const list = config.inMemorySelector();
          const replaced = list.map((item: any) =>
            item.id === anyCreated.clientId ? { ...normalized, id: anyCreated.id } : item
          );
          config.inMemorySetter(replaced);
        }
      }

      // Updated: upsert normalized
      if (result.updated?.length) {
        const normalizedUpdates = result.updated.map(config.normalizeFromServer);
        await config.dbTable.bulkPut(normalizedUpdates as any);
      }

      // Deleted: mark tombstone locally
      for (const id of result.deleted || []) {
        await config.dbTable.update(id as any, { deletedAt: Date.now(), updatedAt: Date.now() } as any);
      }

      // Clear the processed queue
      for (const op of queue) sync.removeFromQueue(entityKey, op.id);
    } catch (err) {
      console.error(`${entityKey} bulk sync failed:`, err);
      // leave queue for retry
    } finally {
      useSyncStore.getState().setSyncing(entityKey, false);
      useSyncStore.getState().setLastSyncTime(entityKey, Date.now());
      isProcessing = false;
    }
  }

  async function syncWithServer(): Promise<void> {
    const userId = config.getUserId();
    if (!userId) return;

    const sync = useSyncStore.getState();
    try {
      await processQueue();

      // Pull all (or delta when available) and LWW-merge
      const remoteAll = await config.fetchAll();
      const normalizedRemote = remoteAll.map(config.normalizeFromServer);

      const local = await config.dbTable.where("userId").equals(userId).toArray();
      const merged = lwwMergeById<any>(local as any, normalizedRemote as any);

      // Replace user's rows with merged
      // Note: Dexie Table API lacks filtered clear, so we update by id
      // Simpler approach: bulkPut merged and leave others intact (only this user's ids are touched)
      await config.dbTable.bulkPut(merged);

      // Update in-memory state (non-deleted)
      const active = merged.filter((x) => !x.deletedAt);
      config.inMemorySetter(active);

      sync.setSyncing(entityKey, false);
      sync.setLastSyncTime(entityKey, Date.now());
    } catch (e) {
      console.error(`${entityKey} syncWithServer failed:`, e);
      sync.setSyncing(entityKey, false);
    }
  }

  return { processQueue, syncWithServer };
}

