# Notes Sync Implementation - Complete Architecture

## Overview
This document outlines the complete implementation of the notes sync system, which mirrors the tasks sync architecture for consistency and maintainability.

## File Structure and Changes

### 1. Backend API Layer

#### `/apps/api/src/modules/note/note.service.ts`
```typescript
// Key Features:
- Bulk sync operation with transaction support
- Handles creates, updates, and deletes in single transaction
- Conflict resolution with Last-Write-Wins (LWW) strategy
- Pinned note logic (only one note can be pinned at a time)
- Graceful provider handling (doesn't fail if provider missing)
- 500 note limit enforcement
- 10,000 character content limit

// Main Methods:
- getNotes(userId): Get all notes for sync
- bulkSync(userId, payload): Handle bulk operations
- _createNote(): Private helper for creation
- _updateNote(): Private helper for updates
```

#### `/apps/api/src/modules/note/note.controller.ts`
```typescript
// Simplified to only two endpoints:
- getNotes: GET /notes - Returns all notes for full sync
- bulkSync: POST /notes/bulk - Handles creates, updates, deletes
```

#### `/apps/api/src/routes/v1/note.routes.ts`
```typescript
// Routes:
GET  /v1/notes      - Get all notes (Pro only)
POST /v1/notes/bulk - Bulk sync endpoint (Pro only)
```

### 2. Frontend Store Layer

#### `/packages/shared/src/stores/note.store.ts`
```typescript
// Key Features:
- EntitySyncManager integration for offline-first sync
- Automatic sync on reconnection
- Pro user restriction enforcement
- Local IndexedDB storage via Dexie
- Optimistic updates with rollback on failure
- Queue-based sync operations

// Main Methods:
- initializeStore(): Initialize and load notes
- loadFromLocal(): Load from IndexedDB
- syncWithServer(): Sync with backend
- addNote(): Create new note with pinned support
- updateNote(): Update existing note
- togglePinNote(): Toggle pin status (only one pinned)
- deleteNote(): Soft delete with tombstone
- setEnableTypingSound(): UI preference

// Sync Configuration:
- Uses sync-core and sync-adapters utilities
- 1 hour auto-sync interval
- Handles online/offline transitions
- Client ID mapping for optimistic updates
```

### 3. Shared API Types

#### `/packages/shared/src/api/note.api.ts`
```typescript
// API Methods:
- getNotes(): Fetch all notes
- bulkSync(): Perform bulk operations

// Payload Types:
creates: Array<{
  clientId?: string;
  title: string;
  content?: string | null;
  pinned?: boolean;
  categoryId?: string | null;
  providerId?: string | null;
  updatedAt?: number;
}>

updates: Array<{
  id?: string;
  clientId?: string;
  title?: string;
  content?: string | null;
  pinned?: boolean;
  categoryId?: string | null;
  updatedAt?: number;
  deletedAt?: number | null;
}>

deletes: Array<{
  id?: string;
  clientId?: string;
  deletedAt?: number;
}>
```

## Database Schema

### Note Model
```typescript
interface Note {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  pinned: boolean;
  categoryId: string | null;
  providerId: string | null;
  createdAt: Date | number;
  updatedAt: Date | number;
  deletedAt: Date | number | null;
}
```

## Sync Flow

### 1. Creation Flow
```
1. User creates note locally
2. Note added to IndexedDB with client-generated ID
3. If pinned, unpin all other notes
4. Add to sync queue with type: "create"
5. If online & Pro user, process queue immediately
6. Server creates note, returns server ID
7. Map client ID to server ID for future operations
```

### 2. Update Flow
```
1. User updates note locally
2. Update IndexedDB immediately (optimistic)
3. If toggling pin, unpin others first
4. Add to sync queue with type: "update"
5. If online & Pro user, process queue
6. Server handles conflict resolution (LWW)
7. If deleted on server but update is newer, resurrect
```

### 3. Delete Flow
```
1. User deletes note locally
2. Set deletedAt timestamp (soft delete)
3. Remove from UI immediately
4. Add to sync queue with type: "delete"
5. If online & Pro user, process queue
6. Server sets tombstone for sync
```

### 4. Sync Process
```
1. Collect all queued operations
2. Group by type (creates, updates, deletes)
3. Send bulk request to server
4. Server processes in transaction
5. Return results with ID mappings
6. Update local IDs with server IDs
7. Clear processed queue items
```

## Conflict Resolution

### Last-Write-Wins (LWW) Strategy
- Each operation includes updatedAt timestamp
- Server collapses multiple updates to same ID
- Latest timestamp wins for conflicts
- Delete operations have precedence unless update is newer

### Delete Precedence
```typescript
if (current.deletedAt) {
  if (!incomingUpdatedAt || incomingUpdatedAt <= current.deletedAt) {
    // Keep deletion, ignore update
    return current;
  }
  // Newer update than deletion → resurrect
  data.deletedAt = null;
}
```

## Pinned Notes Logic

### Rules
1. Only ONE note can be pinned at a time
2. When pinning a note, all others are unpinned
3. Pinned status syncs across devices
4. Cannot create/update multiple pinned notes

### Implementation
```typescript
// When pinning a note:
1. Find all currently pinned notes
2. Unpin them all (update + sync)
3. Pin the target note
4. Update UI optimistically
5. Queue sync operations
```

## Error Handling

### Network Failures
- Operations queued locally
- Retry on reconnection
- Exponential backoff for retries

### Validation Errors
- Title required and must be non-empty
- Content truncated to 10,000 chars
- 500 note limit enforced
- Pro subscription required

### Transaction Rollback
- All bulk operations in transaction
- Rollback on any failure
- Error logged with details

## Performance Optimizations

### Batching
- Multiple operations batched in bulk sync
- Reduces network requests
- Single transaction on server

### Optimistic Updates
- UI updates immediately
- Rollback on sync failure
- Better perceived performance

### Queue Deduplication
- Multiple updates collapsed by timestamp
- Only latest update sent
- Reduces sync payload

## Pro User Restrictions

### Enforcement Points
1. API endpoints check Pro status
2. Store methods check Pro status
3. Sync manager only initialized for Pro users
4. Queue processing skipped for non-Pro

### Free User Behavior
- Notes stored locally only
- No sync to server
- Data persists in IndexedDB
- Upgrades trigger initial sync

## Testing Checklist

- [ ] Create note locally and verify sync
- [ ] Update note and verify sync
- [ ] Delete note and verify sync
- [ ] Pin/unpin notes across devices
- [ ] Offline creation → online sync
- [ ] Conflict resolution scenarios
- [ ] Pro/Free user transitions
- [ ] 500 note limit enforcement
- [ ] Content truncation at 10k chars
- [ ] Provider missing handling

## Migration Notes

### From Individual CRUD to Bulk Sync
1. Removed individual endpoints (GET/POST/PATCH/DELETE /notes/:id)
2. Kept only GET /notes and POST /notes/bulk
3. All operations now go through bulk sync
4. Better offline support and conflict resolution

### Key Differences from Tasks
1. Notes have `content` field (up to 10k chars)
2. Tasks have `completed` and `dueDate` fields
3. Both support `pinned` with same logic
4. Notes handle missing provider gracefully
5. Notes require Pro subscription

## Common Issues and Solutions

### Issue: "Default provider not found"
**Solution**: Notes service now handles missing provider gracefully

### Issue: Pinned status not syncing
**Solution**: Ensure pinned field included in sync payloads

### Issue: Updates not reflecting across devices
**Solution**: Check sync queue processing and network status

### Issue: Notes disappearing after sync
**Solution**: Check deletedAt timestamps and conflict resolution

## Delete Operations

### Soft Delete Strategy
Notes use soft delete (tombstone pattern) for proper sync:
- `deletedAt` timestamp is set instead of hard delete
- Note removed from UI immediately
- Tombstone preserved for sync conflict resolution
- Allows resurrection if newer update arrives

### Delete Implementation
```typescript
// In note.store.ts
deleteNote: async (id) => {
  const deletedAt = Date.now();
  // Soft delete locally
  await db.notes.update(id, { deletedAt, updatedAt: deletedAt });
  // Remove from UI
  set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  // Queue for sync
  syncStore.addToQueue("note", {
    type: "delete",
    entityId: id,
    data: { deletedAt },
  });
}
```

### Usage in UI
```typescript
// Delete a note
await useNoteStore.getState().deleteNote(noteId);
```

### Sync Behavior
1. Delete queued with timestamp
2. Bulk sync sends delete operation
3. Server sets tombstone
4. Other clients filter out deleted notes
5. Tombstone prevents resurrection from old updates

## Future Enhancements

1. Add categories/tags support
2. Rich text content support
3. Attachments/images
4. Search functionality
5. Sharing/collaboration
6. Version history
7. Bulk operations UI
8. Conflict resolution UI
9. Restore deleted notes (within time window)
10. Permanent delete after X days