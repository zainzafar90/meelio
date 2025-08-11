import type { EntityAdapter, DexieTableLike } from "./sync-core";
import type { SyncOperation } from "../stores/sync.store";
import type { EntityType } from "../stores/sync.store";

// Common date normalizer for server responses
export function normalizeDates<T extends Record<string, any>>(item: T): T {
  const normalized: {
    createdAt?: number;
    updatedAt?: number;
    deletedAt?: number;
    dueDate?: string;
  } = { ...item };
  
  if ('createdAt' in item && item.createdAt) {
    normalized.createdAt = new Date(item.createdAt).getTime();
  }
  if ('updatedAt' in item && item.updatedAt) {
    normalized.updatedAt = new Date(item.updatedAt).getTime();
  }
  if ('deletedAt' in item && item.deletedAt) {
    normalized.deletedAt = new Date(item.deletedAt).getTime();
  }
  if ('dueDate' in item && item.dueDate) {
    normalized.dueDate = new Date(item.dueDate).toISOString();
  }
  
  return normalized as T;
}

// Standard payload transformers factory
export function createPayloadTransformers<T extends { id: string }>() {
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

// Factory for creating entity adapters
export interface CreateAdapterOptions<LocalT, RemoteT> {
  entityKey: EntityType;
  dbTable: DexieTableLike<LocalT>;
  api: {
    bulkSync: (payload: any) => Promise<any>;
    fetchAll: () => Promise<RemoteT[]>;
  };
  store: {
    getUserId: () => string | undefined;
    getItems: () => LocalT[];
    setItems: (items: LocalT[]) => void;
  };
  normalizeFromServer?: (remote: RemoteT) => LocalT;
  customTransformers?: Partial<{
    toCreatePayload: (op: SyncOperation) => any;
    toUpdatePayload: (op: SyncOperation) => any;
    toDeletePayload: (op: SyncOperation) => any;
  }>;
  options?: {
    autoSync?: boolean;
    syncInterval?: number;
    enableOptimisticUpdates?: boolean;
  };
}

export function createAdapter<LocalT extends { id: string }, RemoteT>(
  options: CreateAdapterOptions<LocalT, RemoteT>
): EntityAdapter<LocalT, RemoteT, any, any, any> {
  const defaultTransformers = createPayloadTransformers<LocalT>();
  
  return {
    entityKey: options.entityKey,
    dbTable: options.dbTable,
    api: options.api,
    transformers: {
      normalizeFromServer: options.normalizeFromServer || ((item: any) => normalizeDates(item)),
      toCreatePayload: options.customTransformers?.toCreatePayload || defaultTransformers.toCreatePayload,
      toUpdatePayload: options.customTransformers?.toUpdatePayload || defaultTransformers.toUpdatePayload,
      toDeletePayload: options.customTransformers?.toDeletePayload || defaultTransformers.toDeletePayload,
    },
    store: options.store,
    options: options.options
  };
}