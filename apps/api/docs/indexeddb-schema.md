# Meelio IndexedDB Schema

This document outlines the IndexedDB schema for the Meelio application to support offline-first capabilities.

## Database Structure

The IndexedDB database will be structured with the following object stores:

```javascript
const dbSchema = {
  name: 'meelio-db',
  version: 1,
  objectStores: [
    {
      name: 'users',
      keyPath: 'id',
      indexes: [
        { name: 'email', keyPath: 'email', unique: true },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'backgrounds',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'type', keyPath: 'type' },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'soundscapes',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'shareable', keyPath: 'shareable' },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'mantras',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'type', keyPath: 'type' },
        { name: 'date', keyPath: 'date' },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'tasks',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'category', keyPath: 'category' },
        { name: 'status', keyPath: 'status' },
        { name: 'isFocus', keyPath: 'isFocus' },
        { name: 'dueDate', keyPath: 'dueDate' },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'pomodoroSettings',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId', unique: true },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'siteBlockers',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'category', keyPath: 'category' },
        { name: 'url', keyPath: 'url' },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'tabStashes',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'windowId', keyPath: 'windowId' },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'notes',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'title', keyPath: 'title' },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'weatherCache',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId', unique: true },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'breathepod',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId', unique: true },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'focusSessions',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'sessionStart', keyPath: 'sessionStart' },
        { name: 'sessionEnd', keyPath: 'sessionEnd' },
        { name: 'syncStatus', keyPath: '_syncStatus' }
      ]
    },
    {
      name: 'syncQueue',
      keyPath: 'id',
      indexes: [
        { name: 'entity', keyPath: 'entity' },
        { name: 'operation', keyPath: 'operation' },
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    },
    {
      name: 'settings',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId', unique: true },
        { name: 'language', keyPath: 'language' },
        { name: 'offlineMode', keyPath: 'offlineMode' }
      ]
    }
  ]
};
```

## Sync-Related Fields

Each record in the database (except for the `syncQueue` and `settings` stores) will include the following sync-related fields:

- `_syncStatus`: Enum string with values:
  - `'synced'`: Record is in sync with the server
  - `'pending'`: Record has local changes that need to be synced
  - `'conflict'`: Record has conflicts with server version

- `_lastModified`: Timestamp of the last local modification

- `_serverVersion`: Timestamp from the server for the last sync of this record

## Sync Queue Structure

The `syncQueue` store will contain records with the following structure:

```typescript
interface SyncQueueItem {
  id: string; // UUID
  entity: string; // The entity type (e.g., 'tasks', 'notes')
  operation: 'create' | 'update' | 'delete'; // The operation type
  data: any; // The data for the operation
  timestamp: Date; // When the operation was queued
  retryCount: number; // Number of failed sync attempts
  lastRetry?: Date; // Timestamp of the last retry attempt
}
```

## Settings Structure

The `settings` store will contain user-specific settings:

```typescript
interface Settings {
  id: string; // UUID
  userId: string;
  language: string; // User's preferred language
  offlineMode: boolean; // Whether offline mode is enabled
  syncFrequency: number; // How often to sync in minutes
  lastSyncTimestamp?: Date; // When the last sync occurred
  syncOnConnect: boolean; // Whether to sync when connection is restored
  theme: 'light' | 'dark' | 'system'; // User's theme preference
}
```

## Implementation Notes

1. **Initialization**: The database should be initialized when the application starts.

2. **Versioning**: When schema changes are needed, increment the database version and provide upgrade logic.

3. **Indexes**: Indexes are created for fields that will be frequently queried.

4. **Sync Status**: All operations should update the `_syncStatus` and `_lastModified` fields.

5. **Offline Detection**: The application should monitor network status and update the sync queue accordingly.

6. **Bulk Operations**: When syncing, operations should be batched for efficiency.

7. **Conflict Resolution**: When conflicts are detected, they should be resolved according to the conflict resolution strategy. 