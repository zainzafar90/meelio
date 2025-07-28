# Offline Soundscapes Implementation

## Overview

This implementation provides offline capability for soundscapes in the Meelio extension. Once installed, the extension can cache all sound files locally using IndexedDB, allowing users to enjoy soundscapes even without an internet connection.

## How It Works

### 1. Sound Cache Manager (`sound-cache.utils.ts`)

The `SoundCacheManager` class handles all caching operations:

- **IndexedDB Storage**: Uses IndexedDB to store sound files as Blobs
- **Automatic Preloading**: Preloads all sounds when the extension starts
- **Cache Expiry**: Implements a 30-day cache duration
- **Memory + Disk Cache**: Uses in-memory cache for quick access with IndexedDB as persistent storage

### 2. Sound Preloader Component (`sound-preloader.tsx`)

- Automatically triggers sound preloading when the extension starts
- Monitors network status and re-preloads when coming back online
- Runs silently in the background

### 3. Cached Sound Hook (`use-cached-sound.ts`)

- React hook that provides cached URLs for sounds
- Automatically falls back to original URLs if cache misses
- Creates blob URLs from cached data for offline playback

### 4. Offline Indicator (`offline-indicator.tsx`)

- Shows current online/offline status
- Displays cache size
- Provides manual download button for offline use

## Key Features

### Automatic Fallback

The system intelligently handles different scenarios:

1. **Extension (Offline Capable)**:
   - Preloads sounds on first install
   - Uses cached sounds when offline
   - Falls back to network URLs when online if cache misses

2. **Web App (Online Only)**:
   - Always uses network URLs
   - No caching overhead

### Performance Optimizations

- **Lazy Loading**: Sounds are cached in the background without blocking UI
- **Blob URLs**: Creates temporary blob URLs that are automatically cleaned up
- **Progressive Enhancement**: Works immediately with network URLs while caching happens

### Storage Management

- **Cache Size Monitoring**: Users can see how much storage is being used
- **Automatic Cleanup**: Old blob URLs are revoked after 60 seconds
- **30-Day Expiry**: Cache refreshes every 30 days to ensure fresh content

## Implementation Details

### File Structure

```
packages/shared/src/
├── utils/
│   ├── sound-cache.utils.ts      # Core caching logic
│   └── sound.utils.ts            # Updated to use cached sounds
├── hooks/
│   └── use-cached-sound.ts       # React hook for cached URLs
└── components/
    └── core/
        └── soundscapes/
            ├── sound-preloader.tsx    # Background preloader
            ├── offline-indicator.tsx  # UI indicator
            └── components/
                └── sound-player/
                    └── sound-player.tsx  # Updated player
```

### Sound Files Location

All sound files are stored in:
```
apps/extension/public/sounds/
├── yT3sxTz/          # Main soundscape files
├── pomodoro/         # Timer sounds
├── breathing/        # Breathing exercise sounds
└── keyboard/         # Typing sounds
```

### Cache Keys

Sounds are cached with the following key format:
- Soundscapes: `sound-{soundId}` (e.g., `sound-1` for RainOnTent)
- Pomodoro: Uses the sound ID directly (e.g., `timeout-1-back-chime`)
- Keyboard: `keyboard-{type}` (e.g., `keyboard-space`)
- Breathing: `breathing-{type}` (e.g., `breathing-inhale-exhale`)

## Usage

The system works automatically once integrated. No manual configuration needed:

1. **First Install**: Sounds are preloaded in the background
2. **Playing Sounds**: Automatically uses cached versions when available
3. **Offline Mode**: Seamlessly switches to cached sounds
4. **Updates**: Cache refreshes every 30 days

## Browser Compatibility

- **Chrome/Edge**: Full support via Chrome Extension APIs
- **Firefox**: Full support (with appropriate manifest changes)
- **Safari**: Limited support (IndexedDB available but extension APIs differ)

## Future Enhancements

1. **Service Worker Integration**: Could add service worker for more robust caching
2. **Selective Caching**: Allow users to choose which sounds to cache
3. **Compression**: Implement audio compression for smaller cache size
4. **Sync Status**: Show individual sound download progress

## Troubleshooting

### Common Issues

1. **Sounds Not Playing Offline**
   - Check if IndexedDB is enabled in browser
   - Verify cache has been populated (check offline indicator)
   - Clear cache and reload extension

2. **Large Storage Usage**
   - Normal size is ~50-100MB for all sounds
   - Use cache clear function if needed
   - Check browser storage quota

3. **Slow Initial Load**
   - Preloading happens in background
   - Network speed affects initial cache time
   - Once cached, loads instantly