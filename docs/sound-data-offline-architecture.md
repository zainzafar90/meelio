# Sound Data & Offline Architecture

## Overview

The Meelio soundscapes system is designed to work seamlessly both online and offline, with intelligent caching for extension users.

## Architecture Components

### 1. Sound Data Definition (`sounds-data.ts`)
- **Purpose**: Central source of truth for all sound metadata
- **URLs**: Uses `getAssetPath()` to generate correct paths for extension vs webapp
- **Structure**: Static data that defines all available sounds

### 2. Path Resolution (`path.utils.ts`)
```typescript
// Extension: /public/sounds/...
// Webapp: /sounds/... (without /public)
getAssetPath(path)
```

### 3. Offline Caching System

#### Cache Manager (`sound-cache.utils.ts`)
- Stores sounds in IndexedDB as Blobs
- 30-day cache expiry
- Automatic preloading on extension install
- Fallback to network URLs

#### Sound Preloader (`sound-preloader.tsx`)
- Runs automatically when extension starts
- Re-downloads when coming back online
- Silent background operation

#### Cached Sound Hook (`use-cached-sound.ts`)
```typescript
// In components:
const cachedUrl = useCachedSound(sound);
// Returns blob URL if cached, otherwise original URL
```

## How It All Works Together

### For Extension Users:

1. **Initial Load**:
   - Extension starts → SoundPreloader component mounts
   - All sounds from `sounds-data.ts` are fetched and cached
   - IndexedDB stores sounds as Blobs

2. **Playing Sounds**:
   - SoundPlayer uses `useCachedSound` hook
   - Hook checks cache, returns blob URL if available
   - Falls back to network URL if not cached

3. **Offline Mode**:
   - Cached sounds play from IndexedDB
   - No network requests needed
   - Seamless experience

### For Web App Users:

1. **Always Online**:
   - Uses original URLs from `sounds-data.ts`
   - No caching overhead
   - Direct streaming from server

## Key Files & Their Roles

```
sounds-data.ts          → Sound definitions & URLs
path.utils.ts          → URL path resolution
sound-cache.utils.ts   → Caching logic
use-cached-sound.ts    → React integration
sound-player.tsx       → Audio playback with caching
sound-preloader.tsx    → Background preloading
offline-indicator.tsx  → User feedback
```

## URL Structure

### Extension:
```
/public/sounds/yT3sxTz/rain-tent/rain-tent.mp3
/public/sounds/pomodoro/timeout-1-back-chime.mp3
/public/sounds/keyboard/space.mp3
/public/sounds/breathing/inhale-exhale.mp3
```

### Web App:
```
/sounds/yT3sxTz/rain-tent/rain-tent.mp3
/sounds/pomodoro/timeout-1-back-chime.mp3
/sounds/keyboard/space.mp3
/sounds/breathing/inhale-exhale.mp3
```

## Benefits

1. **Zero Configuration**: Works automatically
2. **Progressive Enhancement**: Online-first with offline fallback
3. **Performance**: Blob URLs for instant playback
4. **Storage Efficient**: 30-day expiry, ~50-100MB total
5. **Reliability**: Multiple fallback layers

## Testing Offline Functionality

1. Install extension
2. Open soundscapes and play a sound (triggers caching)
3. Check offline indicator shows cache size
4. Turn off internet/use airplane mode
5. Sounds should continue playing

## Troubleshooting

### Sounds Not Playing Offline:
- Check IndexedDB in DevTools → Application tab
- Verify "meelio-sounds-db" exists with cached sounds
- Clear cache and reload to re-download

### Path Issues:
- Extension must use `/public/` prefix
- Web app must NOT use `/public/` prefix
- `getAssetPath()` handles this automatically