# Meelio Frontend Offline-First Implementation Guide

This guide provides step-by-step instructions for implementing offline-first capabilities in the Meelio frontend applications. Follow these steps in order to ensure a proper implementation.

## Phase 0: Shared Package Setup

### Step 1: Set Up Shared Package Structure
1. Create the shared package structure in `packages/shared`:
   ```bash
   packages/shared/
   ├── src/
   │   ├── lib/
   │   │   ├── db/
   │   │   │   ├── index.ts
   │   │   │   └── models.ts
   │   │   ├── sync/
   │   │   │   ├── queue.ts
   │   │   │   └── conflictResolver.ts
   │   │   ├── repositories/
   │   │   │   └── siteBlockerRepository.ts
   │   │   └── hooks/
   │   │       └── useSiteBlockers.ts
   │   └── index.ts
   ├── package.json
   └── tsconfig.json
   ```

2. Update `packages/shared/package.json`:
   ```json
   {
     "name": "@repo/shared",
     "version": "0.0.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "dependencies": {
       "@tanstack/react-query": "^5.0.0",
       "@tanstack/react-query-persist-client": "^5.0.0",
       "dexie": "^3.2.0",
       "uuid": "^9.0.0"
     }
   }
   ```

3. Export all shared functionality in `packages/shared/src/index.ts`:
   ```typescript
   // Database
   export * from './lib/db';
   export * from './lib/db/models';

   // Sync
   export * from './lib/sync/queue';
   export * from './lib/sync/conflictResolver';

   // Repositories
   export * from './lib/repositories/siteBlockerRepository';

   // Hooks
   export * from './lib/hooks/useSiteBlockers';
   ```

### Step 2: Using Shared Package in Apps
1. Import shared components in web app (`apps/web/src/routes/home/home.tsx`):
   ```typescript
   import {
     useSiteBlockers,
     SiteBlockerRepository,
     SyncQueue,
     // ... other imports
   } from "@repo/shared";
   ```

2. Import shared components in extension (`apps/extension/src/newtab.tsx`):
   ```typescript
   import {
     useSiteBlockers,
     SiteBlockerRepository,
     SyncQueue,
     // ... other imports
   } from "@repo/shared";
   ```

This approach provides:
1. **Code Reusability**: Same offline-first implementation across web and extension
2. **Single Source of Truth**: Models, repositories, and sync logic in one place
3. **Easier Maintenance**: Update shared code once, affects all apps
4. **Consistent Behavior**: Same offline capabilities in both platforms

## Phase 1: Core Infrastructure Setup

### Step 1: Set Up React Query with Offline Persistence
1. Move the implementation to shared package:
   ```typescript
   // packages/shared/src/lib/queryClient.ts
   import { QueryClient } from '@tanstack/react-query';
   import { createIndexedDBPersister } from './indexedDBPersister';

   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         cacheTime: Infinity,
         staleTime: 5 * 60 * 1000,
         retry: (failureCount, error) => {
           if (!navigator.onLine) return false;
           return failureCount < 3;
         },
       },
     },
   });

   // Set up persistence
   persistQueryClient({
     queryClient,
     persister: createIndexedDBPersister('meelio-query-cache'),
   });
   ```

2. Use in apps:
   ```typescript
   // apps/web/src/app.tsx or apps/extension/src/app.tsx
   import { QueryClientProvider } from '@tanstack/react-query';
   import { queryClient } from '@repo/shared';

   export function App() {
     return (
       <QueryClientProvider client={queryClient}>
         {/* App content */}
       </QueryClientProvider>
     );
   }
   ```

### Step 2: Set Up IndexedDB with Dexie.js
1. Create the database schema:
   ```typescript
   // src/lib/db/index.ts
   import Dexie from 'dexie';
   import { models } from './models';

   export class MeelioDB extends Dexie {
     tasks: Dexie.Table<models.Task, string>;
     backgrounds: Dexie.Table<models.Background, string>;
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

2. Create model interfaces:
   ```typescript
   // src/lib/db/models.ts
   export interface BaseModel {
     id: string;
     _syncStatus: 'synced' | 'pending' | 'syncing' | 'conflict';
     _lastModified: string;
     _serverVersion?: string;
     createdAt: string;
     updatedAt: string;
   }

   export interface Task extends BaseModel {
     title: string;
     description?: string;
     dueDate?: string;
     completed: boolean;
     userId: string;
   }

   // ... other model interfaces
   ```

## Phase 2: Network Status Management

### Step 1: Create Network Status Service
1. Implement the network status service:
   ```typescript
   // src/lib/services/networkStatus.ts
   export class NetworkStatusService {
     // ... implementation from architecture doc
   }

   export const networkStatus = new NetworkStatusService();
   ```

2. Create a React hook for network status:
   ```typescript
   // src/hooks/useNetworkStatus.ts
   import { useState, useEffect } from 'react';
   import { networkStatus } from '@/lib/services/networkStatus';

   export function useNetworkStatus() {
     const [isOnline, setIsOnline] = useState(networkStatus.getStatus() === 'online');

     useEffect(() => {
       return networkStatus.addListener((status) => {
         setIsOnline(status === 'online');
       });
     }, []);

     return isOnline;
   }
   ```

## Phase 3: Data Repository Implementation

### Step 1: Create Base Repository
1. Implement the base repository class:
   ```typescript
   // src/lib/repositories/BaseRepository.ts
   export abstract class BaseRepository<T extends BaseModel> {
     constructor(
       protected tableName: string,
       protected db: MeelioDB,
       protected api: ApiService
     ) {}

     // ... implementation of common methods
   }
   ```

### Step 2: Implement Entity Repositories
1. Create task repository:
   ```typescript
   // src/lib/repositories/TaskRepository.ts
   export class TaskRepository extends BaseRepository<Task> {
     // ... implementation from architecture doc
   }
   ```

2. Repeat for other entities (backgrounds, soundscapes, etc.)

## Phase 4: Sync Implementation

### Step 1: Create Sync Queue
1. Implement the sync queue:
   ```typescript
   // src/lib/services/syncQueue.ts
   export interface SyncOperation {
     id: string;
     operation: 'create' | 'update' | 'delete';
     entity: string;
     data: any;
     timestamp: string;
     retries: number;
     version: number;
   }

   export class SyncQueue {
     private queue: SyncOperation[] = [];
     
     constructor() {
       // Load queue from storage
       this.loadQueue();
       
       // Listen for online events
       window.addEventListener('online', () => this.processQueue());
     }
     
     async add(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries' | 'version'>) {
       const item: SyncOperation = {
         ...operation,
         id: uuidv4(),
         timestamp: new Date().toISOString(),
         retries: 0,
         version: await this.getCurrentVersion(operation.entity, operation.data.id)
       };
       
       this.queue.push(item);
       await this.saveQueue();
       
       // If we're online, process immediately
       if (navigator.onLine) {
         this.processQueue();
       }
     }
     
     private async getCurrentVersion(entity: string, id: string): Promise<number> {
       const record = await db[entity].get(id);
       return (record?._version || 0) + 1;
     }
     
     async processQueue() {
       if (!navigator.onLine || this.queue.length === 0) return;
       
       // Group by entity and sort by version
       const groupedOps = this.groupAndSortOperations();
       
       for (const [entity, operations] of Object.entries(groupedOps)) {
         try {
           // Send bulk operations to server
           const results = await api.bulkSync(entity, operations);
           
           // Process results
           for (const result of results) {
             if (result.success) {
               await this.handleSuccess(entity, result);
             } else {
               await this.handleError(entity, result);
             }
           }
         } catch (error) {
           console.error(`Failed to sync ${entity}:`, error);
           await this.handleBatchError(entity, operations, error);
         }
       }
       
       await this.saveQueue();
     }

     private groupAndSortOperations() {
       return this.queue.reduce((groups, op) => {
         if (!groups[op.entity]) groups[op.entity] = [];
         groups[op.entity].push(op);
         groups[op.entity].sort((a, b) => a.version - b.version);
         return groups;
       }, {} as Record<string, SyncOperation[]>);
     }

     private async handleSuccess(entity: string, result: any) {
       // Remove from queue
       this.queue = this.queue.filter(op => op.id !== result.id);
       
       // Update local data
       await db[entity].update(result.data.id, {
         ...result.data,
         _syncStatus: 'synced',
         _version: result.version
       });
     }

     private async handleError(entity: string, result: any) {
       const operation = this.queue.find(op => op.id === result.id);
       if (!operation) return;

       if (result.error === 'VERSION_CONFLICT') {
         // Fetch latest from server
         const serverData = await api.get(entity, operation.data.id);
         
         // Resolve conflict
         const resolved = await conflictResolver.resolve(
           entity,
           operation.data,
           serverData
         );
         
         // Update operation with resolved data
         operation.data = resolved;
         operation.version = serverData._version + 1;
         operation.retries += 1;
       } else {
         // For other errors, increment retry count
         operation.retries += 1;
         
         // If too many retries, mark as failed
         if (operation.retries >= 5) {
           await db[entity].update(operation.data.id, {
             _syncStatus: 'error',
             _errorMessage: result.error
           });
           this.queue = this.queue.filter(op => op.id !== result.id);
         }
       }
     }
   }

   export const syncQueue = new SyncQueue();
   ```

### Step 2: Implement Conflict Resolution
1. Create the conflict resolver:
   ```typescript
   // src/lib/services/conflictResolver.ts
   export class ConflictResolver {
     async resolve(entity: string, localData: any, serverData: any): Promise<any> {
       // If server version is newer and local hasn't changed
       if (serverData._version > (localData._version || 0) && 
           serverData._lastModified === localData._lastModified) {
         return serverData;
       }

       // If local changes are more recent
       if (new Date(localData._lastModified) > new Date(serverData._lastModified)) {
         return {
           ...localData,
           _version: serverData._version + 1
         };
       }

       // For complex conflicts, use field-level merging
       return this.mergeFields(entity, localData, serverData);
     }

     private mergeFields(entity: string, localData: any, serverData: any): any {
       const merged = { ...serverData };
       const strategy = this.getMergeStrategy(entity);

       for (const [field, resolver] of Object.entries(strategy)) {
         merged[field] = resolver(localData[field], serverData[field]);
       }

       return {
         ...merged,
         _version: serverData._version + 1,
         _lastModified: new Date().toISOString()
       };
     }

     private getMergeStrategy(entity: string): Record<string, (local: any, server: any) => any> {
       switch (entity) {
         case 'tasks':
           return {
             title: (local, server) => local || server,
             description: (local, server) => local || server,
             completed: (local, server) => local, // Local completed status wins
             dueDate: (local, server) => new Date(local) > new Date(server) ? local : server
           };
         // Add strategies for other entities
         default:
           return {};
       }
     }
   }

   export const conflictResolver = new ConflictResolver();
   ```

### Step 3: Implement Version Control
1. Add version tracking to base model:
   ```typescript
   // src/lib/db/models.ts
   export interface BaseModel {
     id: string;
     _syncStatus: 'synced' | 'pending' | 'syncing' | 'error';
     _lastModified: string;
     _version: number;
     _errorMessage?: string;
     createdAt: string;
     updatedAt: string;
   }
   ```

This approach provides:
1. **Robust Conflict Resolution**: Version-based conflict detection with field-level merging
2. **Offline Support**: Queue-based sync with retry mechanism
3. **Error Handling**: Proper error states and user feedback
4. **Data Integrity**: Version control prevents data loss
5. **Flexibility**: Easy to customize merge strategies per entity

The key differences from a CRDT approach:
1. **Simpler Infrastructure**: No need for WebSocket server or real-time sync
2. **Bandwidth Efficient**: Only syncs when needed
3. **More Control**: Custom conflict resolution strategies
4. **Better Error Handling**: Explicit error states and retry mechanisms

## Phase 5: UI Components

### Step 1: Create Status Components
1. Implement offline indicator:
   ```typescript
   // src/components/OfflineIndicator.tsx
   export function OfflineIndicator() {
     const isOnline = useNetworkStatus();

     if (isOnline) return null;

     return (
       <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
         You are offline
       </div>
     );
   }
   ```

2. Create sync status component:
   ```typescript
   // src/components/SyncStatus.tsx
   export function SyncStatus() {
     const { pendingCount } = useSyncQueue();

     if (pendingCount === 0) return null;

     return (
       <div className="fixed bottom-4 left-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
         {pendingCount} items pending sync
       </div>
     );
   }
   ```

## Phase 6: Service Worker Implementation

### Step 1: Create Service Worker
1. Create the service worker file:
   ```typescript
   // public/service-worker.ts
   // ... implementation from architecture doc
   ```

2. Register the service worker:
   ```typescript
   // src/lib/serviceWorker.ts
   export async function registerServiceWorker() {
     if ('serviceWorker' in navigator) {
       try {
         const registration = await navigator.serviceWorker.register('/service-worker.js');
         console.log('Service worker registered:', registration);
       } catch (error) {
         console.error('Service worker registration failed:', error);
       }
     }
   }
   ```

## Phase 7: Chrome Extension Integration

### Step 1: Adapt Storage Implementation
1. Create extension storage service:
   ```typescript
   // src/lib/services/extensionStorage.ts
   export class ExtensionStorage {
     // ... implementation from architecture doc
   }
   ```

### Step 2: Set Up Background Sync
1. Create background script:
   ```typescript
   // src/background.ts
   // ... implementation from architecture doc
   ```

## Phase 8: Testing

### Step 1: Set Up Test Environment
1. Create test utilities:
   ```typescript
   // src/test/utils/db.ts
   export function createTestDB() {
     // ... implementation
   }
   ```

### Step 2: Write Tests
1. Create repository tests:
   ```typescript
   // src/lib/repositories/__tests__/TaskRepository.test.ts
   describe('TaskRepository', () => {
     // ... tests
   });
   ```

## Phase 9: Performance Optimization

### Step 1: Implement Lazy Loading
1. Create lazy loading utilities:
   ```typescript
   // src/lib/utils/lazyLoad.ts
   export function createLazyLoader<T>(options: LazyLoadOptions<T>) {
     // ... implementation
   }
   ```

### Step 2: Add Pagination
1. Implement pagination in repositories:
   ```typescript
   // src/lib/repositories/BaseRepository.ts
   async getPage(page: number, limit: number) {
     // ... implementation
   }
   ```

## Phase 10: Documentation

### Step 1: Update API Documentation
1. Document all public APIs and components
2. Create usage examples
3. Document error handling and troubleshooting

### Step 2: Create User Guide
1. Document offline capabilities
2. Create troubleshooting guide
3. Document sync behavior and limitations

## Implementation Order

Follow this order for implementing the features:

1. Core Infrastructure
   - React Query setup
   - IndexedDB setup
   - Network status management

2. Data Layer
   - Base repository
   - Entity repositories
   - Sync queue

3. UI Components
   - Status indicators
   - Error messages
   - Conflict resolution UI

4. Service Worker
   - Cache setup
   - Offline page
   - Background sync

5. Chrome Extension
   - Storage adaptation
   - Background sync
   - UI integration

6. Testing & Optimization
   - Unit tests
   - Integration tests
   - Performance optimization

7. Documentation & Polish
   - API documentation
   - User guide
   - Final testing and bug fixes

## Progress Tracking

Use the implementation plan checklist to track progress. Mark items as completed as you implement them:

```bash
git add docs/frontend-offline-first-implementation-plan.md
git commit -m "Update implementation progress"
```

## Next Steps

1. Start with Phase 1: Core Infrastructure Setup
2. Follow the implementation order
3. Test each component thoroughly before moving to the next
4. Update documentation as you progress
5. Track progress in the implementation plan 

## Example Usage

Here's how the shared offline-first functionality is used in both apps:

1. Web App (`apps/web/src/routes/home/home.tsx`):
   ```typescript
   import { useTranslation } from "react-i18next";
   import {
     useSiteBlockers,
     SiteBlockerSheet,
     // ... other imports from shared
   } from "@repo/shared";

   const Home = () => {
     const { data: siteBlockers } = useSiteBlockers();
     // ... rest of the component
   };
   ```

2. Extension (`apps/extension/src/newtab.tsx`):
   ```typescript
   import {
     useSiteBlockers,
     SiteBlockerSheet,
     // ... other imports from shared
   } from "@repo/shared";

   const Home = () => {
     const { data: siteBlockers } = useSiteBlockers();
     // ... rest of the component
   };
   ```

This shared approach ensures that both the web app and extension have identical offline capabilities, sync behavior, and data management. 

## Related Documentation
- [Frontend Offline-First Architecture](../../Architecture/frontend-offline-first-architecture.md)
- [Offline-First Architecture](../../Architecture/offline-first-architecture.md)
- [IndexedDB Schema](../../Architecture/indexeddb-schema.md)
- [Implementation Plan](./frontend-offline-first-implementation-plan.md)
- [Sync Implementation](../Sync/sync-implementation.md) 