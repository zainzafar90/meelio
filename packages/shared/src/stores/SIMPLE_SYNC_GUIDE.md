# Simple Sync Store Guide

## Overview

A minimal sync store that handles offline-first syncing for different entity types (tasks, pomodoro sessions, etc.) without over-engineering.

## Features

- **Multi-entity support**: Separate queues for tasks, pomodoro, etc.
- **Simple API**: Just 7 methods to understand
- **Automatic retry**: Failed operations retry up to 3 times
- **Online/offline detection**: Built-in browser event listeners

## Usage

### 1. Add to Sync Queue

```typescript
const syncStore = useSimpleSyncStore.getState();

// For tasks
syncStore.addToQueue("task", {
  type: "create",
  entityId: task.id,
  data: task
});

// For pomodoro
syncStore.addToQueue("pomodoro", {
  type: "create", 
  entityId: session.id,
  data: session
});
```

### 2. Process Sync Queue

Each entity type needs its own sync processor:

```typescript
// Task sync (in todo store)
async syncTasks() {
  const queue = syncStore.getQueue("task");
  
  for (const op of queue) {
    try {
      switch (op.type) {
        case "create":
          await taskApi.createTask(op.data);
          syncStore.removeFromQueue("task", op.id);
          break;
        // ... handle update, delete
      }
    } catch (error) {
      syncStore.incrementRetry("task", op.id);
    }
  }
}
```

### 3. Check Sync Status

```typescript
const isSyncingTasks = syncStore.syncingEntities.has("task");
const taskQueue = syncStore.getQueue("task");
const lastTaskSync = syncStore.lastSyncTimes["task"];
```

## Why This Design?

1. **Simple but Extensible**: Easy to add new entity types
2. **No Magic**: You control when and how sync happens
3. **Clear Separation**: Each feature handles its own sync logic
4. **~150 lines total**: Easy to understand and debug

## Adding New Entity Types

1. Add to queue: `syncStore.addToQueue("your-entity", {...})`
2. Create sync function in your store
3. Call sync when online or on timer
4. That's it!

## Example: Tasks vs Pomodoro

```typescript
// Tasks queue operations immediately
syncStore.addToQueue("task", {
  type: "update",
  entityId: taskId,
  data: { completed: true }
});

// Pomodoro might batch sessions
const sessions = getTodaysSessions();
sessions.forEach(session => {
  syncStore.addToQueue("pomodoro", {
    type: "create",
    entityId: session.id,
    data: session
  });
});
```

Both use the same sync store but handle their sync logic independently.