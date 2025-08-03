# Sound Architecture - Offline-First with Progressive Sync

## Overview

The Meelio sound system uses an offline-first architecture with progressive sync:
- Sounds are downloaded progressively to IndexedDB (via Dexie)
- Small bundle size - sounds are fetched after installation
- Automatic fallback to network URLs while syncing
- Seamless offline playback once cached

## Core Principles

1. **Progressive Enhancement**: Works immediately with network, enhances with cache
2. **Small Bundle Size**: Sounds downloaded on-demand, not bundled
3. **Offline-First**: Once cached, sounds play from IndexedDB
4. **Automatic Sync**: Background download with visual progress

## Architecture

### 1. Database Schema (`meelio.dexie.ts`)
```typescript
sounds: "id, path, downloadedAt, lastAccessed"

interface CachedSound {
  id: string;
  path: string;
  blob: Blob;
  size: number;
  lastAccessed: number;
  downloadedAt: number;
}
```

### 2. Sound Sync Service (`sound-sync.service.ts`)
- Progressive download of all sounds
- Stores as Blobs in IndexedDB
- Automatic fallback to network URLs
- Background sync with progress tracking
- Blob URL generation for playback

### 3. React Integration (`use-cached-sound-url.ts`)
```typescript
// Hook that returns cached blob URL or network URL
const soundUrl = useCachedSoundUrl(sound.url);
```

### 4. Components
- **SoundSyncInitializer**: Starts sync on extension load
- **SoundSyncStatus**: Shows sync progress and offline status
- **SoundPlayerItem**: Uses cached URLs with automatic cleanup

## How It Works

### Extension Flow
1. **Initial Load**: Extension starts, minimal bundle size
2. **Progressive Sync**: Sounds download in background to IndexedDB
3. **Smart Playback**: 
   - If cached: Play from blob URL
   - If not cached: Play from network + queue for download
4. **Offline Mode**: All cached sounds play from IndexedDB

### Web App Flow
1. Always streams from server
2. No caching overhead
3. Standard browser caching applies

## Benefits

1. **Small Bundle Size**: ~50-100MB saved from extension package
2. **Progressive Enhancement**: Works immediately, improves over time
3. **True Offline Support**: IndexedDB storage persists across sessions
4. **Automatic Sync**: Re-downloads when coming back online
5. **Visual Feedback**: Users see sync progress and status
6. **Smart Fallbacks**: Network URLs used while syncing

## File Structure

```
packages/shared/src/
├── lib/db/
│   └── meelio.dexie.ts              # Database schema with sounds table
├── services/
│   └── sound-sync.service.ts        # Core sync logic
├── hooks/
│   └── use-cached-sound-url.ts      # React hook for cached URLs
├── components/core/soundscapes/
│   ├── sound-sync-initializer.tsx   # Auto-start sync
│   ├── sound-sync-status.tsx        # Progress UI
│   └── components/sound-player/
│       └── sound-player.tsx         # Uses cached URLs
└── data/
    └── sounds-data.ts               # Sound definitions
```

## Usage Examples

### In Components
```typescript
const soundUrl = useCachedSoundUrl("/public/sounds/rain.mp3");
// Returns blob URL if cached, network URL if not
```

### Service Usage
```typescript
// Get sync status
const status = soundSyncService.getSyncStatus();
// { total: 42, downloaded: 35, isComplete: false }

// Manual sync
await soundSyncService.startSync({
  onProgress: (progress) => console.log(progress),
  onComplete: () => console.log("Done!"),
});
```

## Technical Details

### IndexedDB Storage
- Uses Dexie for reliable cross-browser support
- Stores sounds as Blobs with metadata
- Automatic migration support

### Memory Management
- Blob URLs created on-demand
- Automatic cleanup when components unmount
- Last accessed tracking for future LRU eviction

### Progressive Download
- Batched downloads (3 at a time)
- Continues on network errors
- Resumes when coming back online

## Summary

This architecture provides true offline capability with minimal bundle size impact. By using IndexedDB and progressive sync, users get immediate functionality that improves over time, with full offline support once sync completes.