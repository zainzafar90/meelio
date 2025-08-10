# Sync Architecture Documentation

## Overview

The refactored sync architecture provides a modular, reusable pattern for synchronizing entities between local storage (Dexie/IndexedDB) and the remote server. This approach eliminates code duplication and makes it easy to add sync support for new entity types.

## Core Components

### 1. EntitySyncManager (`sync-core.ts`)

The main class that handles all sync operations for a specific entity type.

**Key Features:**
- Queue-based sync operations
- Automatic retry logic
- Conflict resolution using Last Write Wins (LWW)
- Support for optimistic updates
- Auto-sync with configurable intervals
- Proper cleanup on disposal

### 2. EntityAdapter Interface

Defines the contract between the sync manager and entity-specific implementations:

```typescript
interface EntityAdapter<LocalT, RemoteT, CreatePayload, UpdatePayload, DeletePayload> {
  entityKey: EntityType;
  dbTable: DexieTableLike<LocalT>;
  api: {
    bulkSync: (payload) => Promise<BulkResult<RemoteT>>;
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
```

### 3. Adapter Factory (`sync-adapters.ts`)

Provides helper functions to create adapters with sensible defaults:

- `createAdapter()` - Creates an adapter with standard transformers
- `normalizeDates()` - Normalizes server date formats
- `createPayloadTransformers()` - Creates standard CRUD payload transformers

## Usage Pattern

### 1. Define Your Entity Adapter

```typescript
const taskAdapter = createAdapter<Task, ServerTask>({
  entityKey: "task",
  dbTable: db.tasks,
  api: {
    bulkSync: taskApi.bulkSync,
    fetchAll: () => taskApi.getTasks(),
  },
  store: {
    getUserId: () => useAuthStore.getState().user?.id,
    getItems: () => useTaskStore.getState().tasks,
    setItems: (list) => useTaskStore.setState({ tasks: list }),
  },
  options: {
    autoSync: true,
    syncInterval: 60 * 60 * 1000, // 1 hour
  },
});
```

### 2. Create Sync Manager

```typescript
const taskSyncManager = createEntitySync(taskAdapter);
```

### 3. Use in Store Operations

```typescript
// After local create/update/delete
if (user) {
  syncStore.addToQueue("task", {
    type: "create",
    entityId: newTask.id,
    data: newTask,
  });

  if (syncStore.isOnline && taskSyncManager) {
    taskSyncManager.processQueue();
  }
}
```

### 4. Handle Authentication Changes

```typescript
useAuthStore.subscribe((state) => {
  const user = state.user;
  if (user && !taskSyncManager) {
    initializeTaskSync();
  } else if (!user && taskSyncManager) {
    taskSyncManager.dispose();
    taskSyncManager = null;
  }
});
```

## Server-Side Implementation

The server should implement a bulk sync endpoint that:

1. **Handles Creates**: 
   - Maps `clientId` to server-generated `id`
   - Returns created entities with both IDs

2. **Handles Updates**:
   - Applies LWW conflict resolution
   - Respects deletion tombstones
   - Collapses multiple updates to the same entity

3. **Handles Deletes**:
   - Sets soft-delete tombstones
   - Preserves deletion timestamps for conflict resolution

Example service structure:

```typescript
class EntitySyncService {
  async bulkSync(userId: string, payload: BulkSyncPayload) {
    return db.transaction(async (tx) => {
      const created = [];
      const updated = [];
      const deleted = [];
      const idMap = new Map();

      // Process creates with clientId mapping
      for (const c of payload.creates) {
        const entity = await this.create(userId, c);
        if (c.clientId) idMap.set(c.clientId, entity.id);
        created.push({ ...entity, clientId: c.clientId });
      }

      // Process updates with conflict resolution
      // Process deletes with tombstoning

      return { created, updated, deleted };
    });
  }
}
```

## Adding New Entity Types

1. **Create the adapter**:
```typescript
const noteAdapter = createAdapter<Note, ServerNote>({
  entityKey: "note",
  dbTable: db.notes,
  api: {
    bulkSync: noteApi.bulkSync,
    fetchAll: () => noteApi.getNotes(),
  },
  store: {
    getUserId: () => useAuthStore.getState().user?.id,
    getItems: () => useNoteStore.getState().notes,
    setItems: (list) => useNoteStore.setState({ notes: list }),
  },
});
```

2. **Initialize sync manager on auth**:
```typescript
let noteSyncManager: EntitySyncManager<Note, any, any, any, any> | null = null;

function initializeNoteSync() {
  noteSyncManager = createEntitySync(noteAdapter);
}
```

3. **Add sync calls to store operations**:
```typescript
addNote: async (payload) => {
  // ... create note locally ...
  
  if (user) {
    syncStore.addToQueue("note", {
      type: "create",
      entityId: newNote.id,
      data: newNote,
    });

    if (syncStore.isOnline && noteSyncManager) {
      noteSyncManager.processQueue();
    }
  }
}
```

## Benefits

1. **Code Reusability**: Single implementation for all entity types
2. **Consistency**: All entities follow the same sync pattern
3. **Maintainability**: Updates to sync logic happen in one place
4. **Type Safety**: Full TypeScript support with generics
5. **Flexibility**: Custom transformers and options per entity
6. **Reliability**: Built-in retry logic and conflict resolution
7. **Performance**: Batch operations and optimistic updates

## Migration Guide

To migrate existing stores:

1. Create an adapter configuration
2. Replace manual sync logic with sync manager calls
3. Update store operations to use the queue
4. Add authentication lifecycle management
5. Test offline/online transitions

## Future Enhancements

- Add support for partial sync (pagination)
- Implement incremental sync with timestamps
- Add conflict resolution strategies beyond LWW
- Support for real-time sync via WebSockets
- Add sync progress indicators
- Implement sync health monitoring