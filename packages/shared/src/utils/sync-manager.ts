import type { EntityType, SyncOperation } from "../stores/sync.store";
import { useSyncStore } from "../stores/sync.store";
import { lwwMergeById } from "./sync.utils";

export type BulkResult<T> = {
    created: Array<T & { clientId?: string }>;
    updated: T[];
    deleted: string[];
};

export type DexieTableLike<T> = {
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
};

type Transformers<LocalT, CreatePayload, UpdatePayload, DeletePayload> = {
    normalizeFromServer: (remote: any) => LocalT;
    toCreatePayload: (op: SyncOperation) => CreatePayload | null;
    toUpdatePayload: (op: SyncOperation) => UpdatePayload | null;
    toDeletePayload: (op: SyncOperation) => DeletePayload | null;
};

type SyncAdapter<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload> = {
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
    transformers: Transformers<LocalT, CreatePayload, UpdatePayload, DeletePayload>;
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
};

type SyncState = {
    isProcessing: boolean;
    autoSyncInterval: NodeJS.Timeout | null;
};

const createSyncState = (): SyncState => ({
    isProcessing: false,
    autoSyncInterval: null,
});

const buildBulkPayload = <CreatePayload, UpdatePayload, DeletePayload>(
    queue: SyncOperation[],
    transformers: Transformers<any, CreatePayload, UpdatePayload, DeletePayload>
) => {
    const creates: CreatePayload[] = [];
    const updates: UpdatePayload[] = [];
    const deletes: DeletePayload[] = [];

    queue.forEach((op) => {
        if (op.type === "create") {
            const payload = transformers.toCreatePayload(op);
            if (payload) creates.push(payload);
        } else if (op.type === "update") {
            const payload = transformers.toUpdatePayload(op);
            if (payload) updates.push(payload);
        } else if (op.type === "delete") {
            const payload = transformers.toDeletePayload(op);
            if (payload) deletes.push(payload);
        }
    });

    return { creates, updates, deletes };
};

const applyCreatedItems = async <LocalT>(
    created: Array<any>,
    adapter: SyncAdapter<LocalT, any, any, any, any>
): Promise<Map<string, string>> => {
    const idMap = new Map<string, string>();

    await Promise.all(
        created.map(async (item: any) => {
            if (item.clientId && item.id && item.id !== item.clientId) {
                idMap.set(item.clientId, item.id);

                try {
                    await adapter.dbTable.delete(item.clientId);
                } catch { }

                const normalized = adapter.transformers.normalizeFromServer(item);
                await adapter.dbTable.add(normalized);

                const list = adapter.store.getItems();
                const replaced = list.map((existing: any) =>
                    existing.id === item.clientId ? { ...normalized, id: item.id } : existing
                );
                adapter.store.setItems(replaced);
            }
        })
    );

    return idMap;
};

const applyUpdatedItems = async <LocalT>(
    updated: any[],
    adapter: SyncAdapter<LocalT, any, any, any, any>
): Promise<void> => {
    if (updated.length === 0) return;

    const normalizedUpdates = updated.map(adapter.transformers.normalizeFromServer);
    await adapter.dbTable.bulkPut(normalizedUpdates);

    const updatesById = new Map<string, LocalT>();
    normalizedUpdates.forEach((u) => {
        if (u && (u as any).id) updatesById.set((u as any).id, u);
    });

    if (updatesById.size > 0) {
        const current = adapter.store.getItems();
        const merged = current.map((item) =>
            item && (item as any).id && updatesById.has((item as any).id)
                ? { ...item, ...updatesById.get((item as any).id) }
                : item
        );
        adapter.store.setItems(merged);
    }
};

const applyDeletedItems = async <LocalT>(
    deleted: string[],
    adapter: SyncAdapter<LocalT, any, any, any, any>
): Promise<void> => {
    if (deleted.length === 0) return;

    await Promise.all(
        deleted.map((id) =>
            adapter.dbTable.update(id, {
                deletedAt: Date.now(),
                updatedAt: Date.now(),
            } as unknown as Partial<LocalT>)
        )
    );

    const deletedSet = new Set(deleted);
    const current = adapter.store.getItems();
    const remaining = current.filter(
        (item) => !(item && (item as any).id && deletedSet.has((item as any).id))
    );
    adapter.store.setItems(remaining);
};

const processQueue = async <LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>(
    adapter: SyncAdapter<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>,
    state: SyncState
): Promise<void> => {
    if (state.isProcessing) return;

    const sync = useSyncStore.getState();
    const queue = sync.getQueue(adapter.entityKey);
    const shouldSync = queue.length > 0 && sync.isOnline;
    if (!shouldSync) return;

    state.isProcessing = true;
    sync.setSyncing(adapter.entityKey, true);

    try {
        const { creates, updates, deletes } = buildBulkPayload(queue, adapter.transformers);
        const result = await adapter.api.bulkSync({ creates, updates, deletes });

        await applyCreatedItems(result.created, adapter);
        await applyUpdatedItems(result.updated, adapter);
        await applyDeletedItems(result.deleted, adapter);

        queue.forEach((op) => {
            sync.removeFromQueue(adapter.entityKey, op.id);
        });
    } catch (err) {
        console.error(`${adapter.entityKey} bulk sync failed:`, err);
    } finally {
        sync.setSyncing(adapter.entityKey, false);
        sync.setLastSyncTime(adapter.entityKey, Date.now());
        state.isProcessing = false;
    }
};

const syncWithServer = async <LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>(
    adapter: SyncAdapter<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>,
    state: SyncState
): Promise<void> => {
    const userId = adapter.store.getUserId();
    if (!userId) return;

    const sync = useSyncStore.getState();

    try {
        await processQueue(adapter, state);

        const remoteAll = await adapter.api.fetchAll();
        const normalizedRemote = remoteAll.map(adapter.transformers.normalizeFromServer);

        const remoteIdSet = new Set((normalizedRemote as any[]).map((r) => r.id));
        const local = await adapter.dbTable.where("userId").equals(userId).toArray();

        await Promise.all(
            (local as any[]).map(async (item) => {
                if (!item.deletedAt && item.id && !remoteIdSet.has(item.id)) {
                    await adapter.dbTable.update(item.id, {
                        deletedAt: Date.now(),
                        updatedAt: Date.now(),
                    } as any);
                }
            })
        );

        const merged = lwwMergeById<any>(local as any, normalizedRemote as any);
        await adapter.dbTable.bulkPut(merged);

        const active = merged.filter((x) => !x.deletedAt);
        adapter.store.setItems(active);

        sync.setSyncing(adapter.entityKey, false);
        sync.setLastSyncTime(adapter.entityKey, Date.now());
    } catch (e) {
        console.error(`${adapter.entityKey} syncWithServer failed:`, e);
        sync.setSyncing(adapter.entityKey, false);
    }
};

const createAutoSync = (
    adapter: SyncAdapter<any, any, any, any, any>,
    state: SyncState,
    interval: number
): (() => void) => {
    if (state.autoSyncInterval) {
        clearInterval(state.autoSyncInterval);
    }

    state.autoSyncInterval = setInterval(() => {
        processQueue(adapter, state);
    }, interval);

    return () => {
        if (state.autoSyncInterval) {
            clearInterval(state.autoSyncInterval);
            state.autoSyncInterval = null;
        }
    };
};

export const createSyncManager = <LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>(
    adapter: SyncAdapter<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload>
) => {
    const state = createSyncState();

    if (adapter.options?.autoSync) {
        createAutoSync(adapter, state, adapter.options.syncInterval || 3600000);
    }

    return {
        processQueue: () => processQueue(adapter, state),
        syncWithServer: () => syncWithServer(adapter, state),
        dispose: () => {
            if (state.autoSyncInterval) {
                clearInterval(state.autoSyncInterval);
                state.autoSyncInterval = null;
            }
        },
    };
};

