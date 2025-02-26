# Meelio Frontend Offline-First Architecture

This document outlines the architecture for implementing offline-first capabilities in the Meelio frontend applications (web and extension).

## Core Principles

1. **Local-First Data**: All data is stored locally first, then synced to the server when online.
2. **Optimistic UI**: UI updates immediately based on local changes, without waiting for server confirmation.
3. **Background Sync**: Data synchronizes automatically when connectivity is restored.
4. **Conflict Resolution**: Clear strategies for handling conflicts between local and server data.
5. **Seamless Experience**: Users should not notice a difference in functionality when offline.

## Frontend Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React          │◄────┤  Data Repository│◄────┤  API Service    │
│  Components     │     │  + React Query  │     │                 │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         │              ┌────────▼────────┐              │
         │              │                 │              │
         └──────────────┤  IndexedDB      ├──────────────┘
                        │                 │
                        └─────────────────┘
```

## React Query Integration

We'll use React Query with custom persistence to IndexedDB:

1. **Custom Persistence Layer**:
   ```typescript
   // Example of custom persistence layer
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         cacheTime: Infinity,
         staleTime: 5 * 60 * 1000, // 5 minutes
         retry: (failureCount, error) => {
           // Don't retry if we're offline
           if (!navigator.onLine) return false;
           return failureCount < 3;
         },
       },
     },
   });

   // Persist cache to IndexedDB
   persistQueryClient({
     queryClient,
     persister: createIndexedDBPersister('meelio-query-cache'),
   });
   ```

2. **Optimistic Updates**:
   ```typescript
   // Example of optimistic update
   const mutation = useMutation(
     (newTask) => api.createTask(newTask),
     {
       // When mutate is called:
       onMutate: async (newTask) => {
         // Cancel outgoing refetches
         await queryClient.cancelQueries('tasks');
         
         // Snapshot the previous value
         const previousTasks = queryClient.getQueryData('tasks');
         
         // Optimistically update to the new value
         queryClient.setQueryData('tasks', old => [...old, newTask]);
         
         // Add to sync queue if offline
         if (!navigator.onLine) {
           syncQueue.add('createTask', newTask);
         }
         
         // Return context with the snapshotted value
         return { previousTasks };
       },
       onError: (err, newTask, context) => {
         queryClient.setQueryData('tasks', context.previousTasks);
       },
       onSettled: () => {
         queryClient.invalidateQueries('tasks');
       },
     }
   );
   ```

## IndexedDB Implementation

We'll use Dexie.js for IndexedDB interactions:

```typescript
// Example Dexie.js setup
import Dexie from 'dexie';

export class MeelioDB extends Dexie {
  tasks: Dexie.Table<TaskModel, string>;
  backgrounds: Dexie.Table<BackgroundModel, string>;
  // ... other tables

  constructor() {
    super('MeelioDB');
    
    this.version(1).stores({
      tasks: 'id, _syncStatus, _lastModified, userId, dueDate',
      backgrounds: 'id, _syncStatus, _lastModified, userId',
      // ... other tables
    });
  }
}

export const db = new MeelioDB();
```

## Data Repository Pattern

Each data type will have a repository that handles both online and offline operations:

```typescript
// Example Task Repository
export class TaskRepository {
  async getAll(): Promise<Task[]> {
    // Try to get from API if online
    if (navigator.onLine) {
      try {
        const tasks = await api.getTasks();
        // Update local cache
        await db.tasks.bulkPut(tasks.map(task => ({
          ...task,
          _syncStatus: 'synced',
          _lastModified: new Date().toISOString(),
          _serverVersion: task.updatedAt
        })));
        return tasks;
      } catch (error) {
        console.error('Failed to fetch tasks from API:', error);
        // Fall back to local data
      }
    }
    
    // Return from local DB
    return db.tasks.toArray();
  }
  
  async create(task: TaskInput): Promise<Task> {
    // Generate client ID
    const clientId = uuidv4();
    
    // Create local record
    const newTask = {
      id: clientId,
      ...task,
      _syncStatus: navigator.onLine ? 'syncing' : 'pending',
      _lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to local DB
    await db.tasks.add(newTask);
    
    // If online, sync immediately
    if (navigator.onLine) {
      try {
        const serverTask = await api.createTask(task);
        // Update local record with server ID and version
        await db.tasks.update(clientId, {
          id: serverTask.id,
          _syncStatus: 'synced',
          _serverVersion: serverTask.updatedAt
        });
        return serverTask;
      } catch (error) {
        // Mark as pending if sync fails
        await db.tasks.update(clientId, { _syncStatus: 'pending' });
        // Add to sync queue
        syncQueue.add('createTask', { clientId, task });
      }
    } else {
      // Add to sync queue
      syncQueue.add('createTask', { clientId, task });
    }
    
    return newTask;
  }
  
  // ... update, delete, and other methods
}
```

## Sync Queue Implementation

```typescript
// Example Sync Queue
export class SyncQueue {
  private queue: Array<{
    id: string;
    operation: string;
    entity: string;
    data: any;
    timestamp: string;
    retries: number;
  }> = [];
  
  constructor() {
    // Load queue from storage
    this.loadQueue();
    
    // Listen for online events
    window.addEventListener('online', this.processQueue.bind(this));
  }
  
  async add(operation: string, data: any, entity: string = getEntityFromData(data)) {
    const item = {
      id: uuidv4(),
      operation,
      entity,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    };
    
    this.queue.push(item);
    await this.saveQueue();
    
    // If we're online, process immediately
    if (navigator.onLine) {
      this.processQueue();
    }
  }
  
  async processQueue() {
    if (!navigator.onLine || this.queue.length === 0) return;
    
    // Group by entity for bulk operations
    const groupedOperations = this.groupByEntity();
    
    for (const [entity, operations] of Object.entries(groupedOperations)) {
      try {
        // Send bulk operations to server
        const results = await api.bulkSync(entity, operations);
        
        // Process results
        for (const result of results) {
          if (result.success) {
            // Remove from queue
            this.removeFromQueue(result.id);
            
            // Update local data
            if (result.operation === 'create') {
              await db[entity].update(result.clientId, {
                id: result.serverId,
                _syncStatus: 'synced',
                _serverVersion: result.version
              });
            } else {
              await db[entity].update(result.id, {
                _syncStatus: 'synced',
                _serverVersion: result.version
              });
            }
          } else {
            // Handle error
            this.handleSyncError(result);
          }
        }
      } catch (error) {
        console.error(`Failed to sync ${entity}:`, error);
        // Increment retry count for failed operations
        this.incrementRetries(entity);
      }
    }
    
    await this.saveQueue();
  }
  
  // ... other methods
}

export const syncQueue = new SyncQueue();
```

## Network Status Management

```typescript
// Example Network Status Service
export class NetworkStatusService {
  private status: 'online' | 'offline' = navigator.onLine ? 'online' : 'offline';
  private listeners: Array<(status: 'online' | 'offline') => void> = [];
  
  constructor() {
    window.addEventListener('online', () => this.updateStatus('online'));
    window.addEventListener('offline', () => this.updateStatus('offline'));
    
    // Additional connectivity check
    setInterval(this.checkConnectivity.bind(this), 30000);
  }
  
  private async checkConnectivity() {
    try {
      const response = await fetch('/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      this.updateStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      this.updateStatus('offline');
    }
  }
  
  private updateStatus(newStatus: 'online' | 'offline') {
    if (this.status !== newStatus) {
      this.status = newStatus;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(newStatus));
      
      // If coming back online, process sync queue
      if (newStatus === 'online') {
        syncQueue.processQueue();
      }
    }
  }
  
  public getStatus(): 'online' | 'offline' {
    return this.status;
  }
  
  public addListener(listener: (status: 'online' | 'offline') => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const networkStatus = new NetworkStatusService();
```

## Conflict Resolution

```typescript
// Example Conflict Resolution
export class ConflictResolver {
  async resolveConflict(entity: string, localData: any, serverData: any, strategy: 'server-wins' | 'client-wins' | 'merge' | 'manual' = 'server-wins') {
    switch (strategy) {
      case 'server-wins':
        return this.serverWins(entity, localData, serverData);
      
      case 'client-wins':
        return this.clientWins(entity, localData, serverData);
      
      case 'merge':
        return this.merge(entity, localData, serverData);
      
      case 'manual':
        return this.promptUser(entity, localData, serverData);
      
      default:
        return this.serverWins(entity, localData, serverData);
    }
  }
  
  private async serverWins(entity: string, localData: any, serverData: any) {
    // Update local data with server data
    const mergedData = {
      ...serverData,
      _syncStatus: 'synced',
      _lastModified: new Date().toISOString(),
      _serverVersion: serverData.updatedAt
    };
    
    await db[entity].put(mergedData);
    return mergedData;
  }
  
  private async clientWins(entity: string, localData: any, serverData: any) {
    // Keep local data but mark for sync
    const mergedData = {
      ...localData,
      _syncStatus: 'pending',
      _lastModified: new Date().toISOString()
    };
    
    await db[entity].put(mergedData);
    syncQueue.add('update', mergedData, entity);
    return mergedData;
  }
  
  private async merge(entity: string, localData: any, serverData: any) {
    // Merge based on field-level rules
    const mergedData = this.getMergedData(entity, localData, serverData);
    
    await db[entity].put({
      ...mergedData,
      _syncStatus: 'pending',
      _lastModified: new Date().toISOString()
    });
    
    syncQueue.add('update', mergedData, entity);
    return mergedData;
  }
  
  private async promptUser(entity: string, localData: any, serverData: any) {
    // This would be implemented with a UI component
    // For now, default to server-wins
    return this.serverWins(entity, localData, serverData);
  }
  
  private getMergedData(entity: string, localData: any, serverData: any) {
    // Entity-specific merge logic
    switch (entity) {
      case 'tasks':
        return {
          ...serverData,
          title: localData.title !== serverData.title ? localData.title : serverData.title,
          description: localData.description !== serverData.description ? localData.description : serverData.description,
          // Other fields...
        };
      
      // Other entities...
      
      default:
        return serverData;
    }
  }
}

export const conflictResolver = new ConflictResolver();
```

## Service Worker Implementation (Web)

For the web application, we'll implement a service worker for offline capabilities:

```typescript
// service-worker.ts
const CACHE_NAME = 'meelio-cache-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/',
        '/index.html',
        '/static/css/main.css',
        '/static/js/main.js',
        // Other static assets
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // API requests - network first, then offline handling
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return a custom offline response for API requests
          return new Response(
            JSON.stringify({ error: 'You are offline', offline: true }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }
  
  // Static assets - cache first, network as fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => {
        // If both cache and network fail, show offline page
        return caches.match(OFFLINE_URL);
      });
    })
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // This would be implemented to process the sync queue
  // For now, just a placeholder
  console.log('Background sync triggered');
}
```

## Chrome Extension Implementation

For the Chrome extension, we'll adapt our approach:

```typescript
// Example Chrome Extension Storage
export class ExtensionStorage {
  async get(key: string): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]);
      });
    });
  }
  
  async set(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }
  
  async remove(key: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  }
}

// Example background script for sync
chrome.runtime.onInstalled.addListener(() => {
  // Set up alarm for periodic sync
  chrome.alarms.create('sync', { periodInMinutes: 15 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync') {
    performSync();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sync') {
    performSync().then(sendResponse);
    return true; // Indicates async response
  }
});

async function performSync() {
  // Check if online
  const online = navigator.onLine;
  if (!online) return { success: false, reason: 'offline' };
  
  try {
    // Get sync queue
    const storage = new ExtensionStorage();
    const queue = await storage.get('syncQueue') || [];
    
    if (queue.length === 0) {
      return { success: true, message: 'Nothing to sync' };
    }
    
    // Group by entity
    const groupedOperations = groupByEntity(queue);
    
    // Process each entity
    for (const [entity, operations] of Object.entries(groupedOperations)) {
      const results = await api.bulkSync(entity, operations);
      
      // Process results and update local storage
      // ... implementation details
    }
    
    return { success: true, message: 'Sync completed' };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, reason: 'error', error };
  }
}
```

## Performance Considerations

- Implement lazy loading for offline data
- Use pagination for large datasets
- Create efficient indexing strategies
- Implement data compression for storage
- Add batch processing for sync operations

## Security Considerations

- Encrypt sensitive data in local storage
- Implement proper authentication for sync operations
- Handle token expiration and refresh during offline periods
- Validate data integrity during sync

## Premium vs Free Features

- Free users: Limited storage and sync frequency
- Premium users: Unlimited storage and priority sync
- Feature flags to control access to premium features
- Graceful degradation for free users when limits are reached 