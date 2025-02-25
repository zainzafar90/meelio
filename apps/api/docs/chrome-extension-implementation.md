# Meelio Chrome Extension Implementation

This document outlines the implementation details for the Meelio Chrome Extension with offline-first capabilities.

## Architecture Overview

The Chrome Extension will be built using Plasmo with React and TypeScript, following an offline-first approach:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Chrome Extension                           │
├─────────────────┬───────────────────────┬─────────────────────┐
│                 │                       │                     │
│  New Tab Page   │   Background Script   │   Content Script    │
│                 │                       │                     │
└────────┬────────┴──────────┬────────────┴──────────┬──────────┘
         │                   │                       │
         │                   │                       │
         │         ┌─────────▼─────────┐             │
         │         │                   │             │
         └─────────►   Storage Layer   ◄─────────────┘
                   │                   │
                   └─────────┬─────────┘
                             │
                             │
                   ┌─────────▼─────────┐
                   │                   │
                   │    API Service    │
                   │                   │
                   └───────────────────┘
```

## Storage Implementation

The extension will use Chrome's `storage.local` API for persistent storage:

```typescript
// Example storage structure
interface StorageSchema {
  user: {
    id: string;
    email: string;
    name: string;
    isLoggedIn: boolean;
    lastSynced: number;
  };
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    offlineMode: boolean;
    syncFrequency: number;
  };
  data: {
    backgrounds: Background[];
    tasks: Task[];
    mantras: Mantra[];
    notes: Note[];
    // ... other data types
  };
  syncQueue: SyncQueueItem[];
}

// Storage service
class StorageService {
  async get<T>(key: keyof StorageSchema): Promise<T> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] as T);
      });
    });
  }

  async set<T>(key: keyof StorageSchema, value: T): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  async remove(key: keyof StorageSchema): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], resolve);
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }
}
```

## Sync Implementation

The extension will implement a background sync mechanism:

```typescript
class SyncService {
  private storageService: StorageService;
  private apiService: ApiService;
  private syncInProgress: boolean = false;

  constructor() {
    this.storageService = new StorageService();
    this.apiService = new ApiService();
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Set up periodic sync
    this.setupPeriodicSync();
  }

  private async handleOnline() {
    const settings = await this.storageService.get<Settings>('settings');
    if (settings.syncOnConnect) {
      this.syncData();
    }
  }

  private handleOffline() {
    // Update UI to show offline status
  }

  private async setupPeriodicSync() {
    const settings = await this.storageService.get<Settings>('settings');
    setInterval(() => {
      if (navigator.onLine) {
        this.syncData();
      }
    }, settings.syncFrequency * 60 * 1000);
  }

  async syncData() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    try {
      // Get pending operations from sync queue
      const syncQueue = await this.storageService.get<SyncQueueItem[]>('syncQueue');
      if (syncQueue.length === 0) return;
      
      // Get last sync timestamp
      const user = await this.storageService.get<User>('user');
      
      // Send sync request to API
      const response = await this.apiService.sync({
        operations: syncQueue,
        lastSyncTimestamp: user.lastSynced
      });
      
      // Process server changes
      await this.processServerChanges(response.serverChanges);
      
      // Update sync status
      await this.storageService.set('syncQueue', []);
      await this.updateUserLastSynced(response.timestamp);
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processServerChanges(changes: any[]) {
    // Apply server changes to local storage
    for (const change of changes) {
      const { entity, operation, data } = change;
      const items = await this.storageService.get<any[]>(`data.${entity}`);
      
      switch (operation) {
        case 'create':
        case 'update':
          const index = items.findIndex(item => item.id === data.id);
          if (index >= 0) {
            items[index] = { ...data, _syncStatus: 'synced' };
          } else {
            items.push({ ...data, _syncStatus: 'synced' });
          }
          break;
        case 'delete':
          const newItems = items.filter(item => item.id !== data.id);
          await this.storageService.set(`data.${entity}`, newItems);
          break;
      }
      
      await this.storageService.set(`data.${entity}`, items);
    }
  }

  private async updateUserLastSynced(timestamp: number) {
    const user = await this.storageService.get<User>('user');
    await this.storageService.set('user', {
      ...user,
      lastSynced: timestamp
    });
  }

  // Add operation to sync queue
  async queueOperation(operation: SyncQueueItem) {
    const syncQueue = await this.storageService.get<SyncQueueItem[]>('syncQueue');
    syncQueue.push(operation);
    await this.storageService.set('syncQueue', syncQueue);
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncData();
    }
  }
}
```

## Feature Implementation

### 1. New Tab Page

The new tab page will be the main interface for the extension, displaying:

- Custom backgrounds
- Daily mantras
- Tasks and focus task
- Weather information
- Quick access to other features

```typescript
// Example component structure
const NewTabPage: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [background, setBackground] = useState<Background | null>(null);
  const [mantra, setMantra] = useState<Mantra | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  
  useEffect(() => {
    // Load data from storage
    loadData();
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const loadData = async () => {
    const storageService = new StorageService();
    const backgrounds = await storageService.get<Background[]>('data.backgrounds');
    const mantras = await storageService.get<Mantra[]>('data.mantras');
    const allTasks = await storageService.get<Task[]>('data.tasks');
    
    // Set current background based on schedule
    setBackground(selectBackgroundForToday(backgrounds));
    
    // Set mantra for today
    setMantra(selectMantraForToday(mantras));
    
    // Set tasks
    setTasks(allTasks.filter(task => !task.isFocus));
    setFocusTask(allTasks.find(task => task.isFocus) || null);
  };
  
  const handleOnline = () => setIsOffline(false);
  const handleOffline = () => setIsOffline(true);
  
  return (
    <div className="new-tab-page" style={{ backgroundImage: `url(${background?.url})` }}>
      {isOffline && <OfflineIndicator />}
      
      <Header />
      
      <MantraDisplay mantra={mantra} />
      
      <TaskSection>
        <FocusTask task={focusTask} />
        <TaskList tasks={tasks} />
      </TaskSection>
      
      <Footer />
    </div>
  );
};
```

### 2. Site Blocker

The site blocker will prevent access to specified sites during focus sessions:

```typescript
// Content script for site blocking
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_BLOCK') {
    const currentUrl = window.location.href;
    
    // Check if URL should be blocked
    chrome.storage.local.get(['data.siteBlockers', 'pomodoroActive'], (result) => {
      const { 'data.siteBlockers': blockers, pomodoroActive } = result;
      
      if (pomodoroActive && isUrlBlocked(currentUrl, blockers)) {
        // Replace page content with block message
        document.body.innerHTML = `
          <div class="site-blocked">
            <h1>Site Blocked</h1>
            <p>This site is blocked during your focus session.</p>
            <button id="override-block">Override Block</button>
          </div>
        `;
        
        // Add event listener for override button
        document.getElementById('override-block')?.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'OVERRIDE_BLOCK', url: currentUrl });
        });
      }
      
      sendResponse({ blocked: pomodoroActive && isUrlBlocked(currentUrl, blockers) });
    });
    
    return true; // Keep the message channel open for async response
  }
});

function isUrlBlocked(url: string, blockers: SiteBlocker[]): boolean {
  return blockers.some(blocker => {
    const pattern = blocker.url;
    return new RegExp(pattern).test(url);
  });
}
```

### 3. Tab Stashing

The tab stashing feature will allow users to save and restore groups of tabs:

```typescript
// Background script for tab stashing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STASH_CURRENT_WINDOW') {
    stashCurrentWindow();
  } else if (message.type === 'RESTORE_STASH') {
    restoreStash(message.stashId);
  }
});

async function stashCurrentWindow() {
  const storageService = new StorageService();
  const syncService = new SyncService();
  
  // Get current window tabs
  const tabs = await new Promise<chrome.tabs.Tab[]>(resolve => {
    chrome.tabs.query({ currentWindow: true }, resolve);
  });
  
  // Create stash object
  const stash: TabStash = {
    id: generateUuid(),
    userId: (await storageService.get<User>('user')).id,
    windowId: String(tabs[0].windowId),
    urls: tabs.map(tab => tab.url || ''),
    createdAt: new Date(),
    updatedAt: new Date(),
    _syncStatus: 'pending',
    _lastModified: new Date(),
  };
  
  // Save to storage
  const stashes = await storageService.get<TabStash[]>('data.tabStashes') || [];
  stashes.push(stash);
  await storageService.set('data.tabStashes', stashes);
  
  // Queue for sync
  syncService.queueOperation({
    id: generateUuid(),
    entity: 'tabStashes',
    operation: 'create',
    data: stash,
    timestamp: new Date(),
    retryCount: 0
  });
  
  // Close tabs
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.remove(tab.id);
    }
  }
}

async function restoreStash(stashId: string) {
  const storageService = new StorageService();
  
  // Get stash
  const stashes = await storageService.get<TabStash[]>('data.tabStashes') || [];
  const stash = stashes.find(s => s.id === stashId);
  
  if (!stash) return;
  
  // Create new window with tabs
  chrome.windows.create({
    url: stash.urls,
    focused: true
  });
}
```

## Offline Mode Considerations

1. **Storage Limits**: Chrome's `storage.local` has a limit of 5-10MB depending on the browser. The extension will implement:
   - Prioritization of essential data
   - Cleanup of old data
   - Warning when approaching limits

2. **Sync Efficiency**: To minimize data transfer:
   - Only sync changed data
   - Compress data when possible
   - Batch operations

3. **Error Handling**: Robust error handling for:
   - Network failures
   - Storage quota exceeded
   - API errors

4. **User Experience**: Clear indicators for:
   - Offline status
   - Pending sync operations
   - Sync conflicts

## Premium Features

The extension will implement feature flags for premium features:

```typescript
// Example premium feature check
async function canUseFeature(feature: string): Promise<boolean> {
  const storageService = new StorageService();
  const user = await storageService.get<User>('user');
  
  // Check if user has premium access
  const hasPremium = user.subscription?.isPremium || false;
  
  // Feature access map
  const featureAccess = {
    'custom-backgrounds': true, // Free for all
    'soundscapes': hasPremium,
    'site-blocker': hasPremium, // Free for all
    'tab-stashes': true, // Free for all
    'notes': true, // Free for all
    'weather': hasPremium,
    'breathepod': true, // Free for all
    'unlimited-tasks': hasPremium,
    'unlimited-storage': hasPremium
  };
  
  return featureAccess[feature] || false;
}
```

## Testing Strategy

1. **Unit Tests**: Test individual components and services
2. **Integration Tests**: Test interactions between components
3. **Offline Tests**: Simulate offline scenarios
4. **Storage Tests**: Test storage limits and edge cases
5. **Sync Tests**: Test sync scenarios and conflict resolution 