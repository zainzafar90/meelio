import { db } from "../lib/db/meelio.dexie";
import { allSounds, pomodoroSounds, keyboardSounds, breathingSounds } from "../data/sounds-data";
import { getSoundUrl } from "../utils/sound-loader";

export interface SoundSyncProgress {
  total: number;
  downloaded: number;
  currentSound?: string;
  isComplete: boolean;
}

export interface SoundSyncOptions {
  onProgress?: (progress: SoundSyncProgress) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

const syncState = {
  isSyncing: false,
  syncQueue: new Set<string>(),
  progress: {
    total: 0,
    downloaded: 0,
    isComplete: false,
  } as SoundSyncProgress,
};

const updateProgress = (updates: Partial<SoundSyncProgress>): SoundSyncProgress => {
  syncState.progress = { ...syncState.progress, ...updates };
  return { ...syncState.progress };
};

const setSyncing = (value: boolean): void => {
  syncState.isSyncing = value;
};

const addToQueue = (path: string): void => {
  syncState.syncQueue.add(path);
};

const removeFromQueue = (path: string): void => {
  syncState.syncQueue.delete(path);
};

export const getAllSoundPaths = (): string[] => {
  const paths: string[] = [];
  
  // Soundscapes
  allSounds.forEach(sound => paths.push(sound.url));
  
  // Pomodoro sounds
  pomodoroSounds.forEach(sound => paths.push(sound.url));
  
  // Keyboard sounds
  paths.push(keyboardSounds.space);
  paths.push(keyboardSounds.return);
  paths.push(keyboardSounds.backspace);
  paths.push(...keyboardSounds.keys);
  
  // Breathing sounds
  paths.push(breathingSounds.inhaleExhale);
  paths.push(breathingSounds.hold);
  
  return paths;
};

export const pathToId = (path: string): string => {
  return path.replace(/[^a-zA-Z0-9]/g, '_');
};

export const downloadSound = async (
  path: string,
  onProgress?: (sound: string) => void
): Promise<void> => {
  const soundName = path.split('/').pop() || path;
  onProgress?.(soundName);

  // For CDN URLs, use them directly. For local paths, use getSoundUrl
  const url = path.startsWith('http') ? path : getSoundUrl(path);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }

  const blob = await response.blob();
  
  // Store in database
  const soundId = pathToId(path);
  await db.sounds.put({
    id: soundId,
    path,
    blob,
    size: blob.size,
    downloadedAt: Date.now(),
    lastAccessed: Date.now(),
  });
};

export const getCachedSounds = async (): Promise<string[]> => {
  const cached = await db.sounds.toArray();
  return cached.map(s => s.path);
};

export const startSync = async (options?: SoundSyncOptions): Promise<void> => {
  if (syncState.isSyncing) {
    return;
  }

  setSyncing(true);
  
  try {
    const allPaths = getAllSoundPaths();
    const cachedPaths = await getCachedSounds();
    const cachedSet = new Set(cachedPaths);
    
    // Find sounds that need to be downloaded
    const toDownload = allPaths.filter(path => !cachedSet.has(path));
    
    updateProgress({
      total: allPaths.length,
      downloaded: cachedPaths.length,
      isComplete: toDownload.length === 0,
    });

    if (toDownload.length === 0) {
      options?.onComplete?.();
      return;
    }

    const BATCH_SIZE = 3;
    
    for (let i = 0; i < toDownload.length; i += BATCH_SIZE) {
      const batch = toDownload.slice(i, i + BATCH_SIZE);
      
      await Promise.allSettled(
        batch.map(async (path) => {
          try {
            await downloadSound(path, (soundName) => {
              const progress = updateProgress({ currentSound: soundName });
              options?.onProgress?.(progress);
            });
            
            const progress = updateProgress({ 
              downloaded: syncState.progress.downloaded + 1 
            });
            options?.onProgress?.(progress);
          } catch (error) {
            console.error(`Failed to cache sound ${path}:`, error);
            options?.onError?.(error as Error);
          }
        })
      );
    }

    updateProgress({ isComplete: true });
    options?.onComplete?.();
  } finally {
    setSyncing(false);
  }
};

export const getCachedSoundUrl = async (path: string): Promise<string> => {
  const soundId = pathToId(path);
  
  try {
    const cached = await db.sounds.get(soundId);
    
    if (cached) {
      // Update last accessed time
      await db.sounds.update(soundId, {
        lastAccessed: Date.now(),
      });
      
      // Return blob URL
      return URL.createObjectURL(cached.blob);
    }
  } catch (error) {
    console.error("Failed to get cached sound:", error);
  }

  // Fallback to network URL and queue for download
  const networkUrl = path.startsWith('http') ? path : getSoundUrl(path);
  
  // Queue for background download if not already syncing
  if (!syncState.syncQueue.has(path)) {
    addToQueue(path);
    downloadSound(path)
      .catch(console.error)
      .finally(() => removeFromQueue(path));
  }

  return networkUrl;
};

export const getSyncStatus = (): SoundSyncProgress => ({ ...syncState.progress });

export const clearCache = async (): Promise<void> => {
  await db.sounds.clear();
  updateProgress({
    total: 0,
    downloaded: 0,
    isComplete: false,
  });
};

export const getCacheSize = async (): Promise<number> => {
  const sounds = await db.sounds.toArray();
  return sounds.reduce((total, sound) => total + sound.size, 0);
};

export const cleanupBlobUrl = (url: string): void => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

export const soundSyncService = {
  startSync,
  getSoundUrl: getCachedSoundUrl,
  getSyncStatus,
  clearCache,
  getCacheSize,
  cleanupBlobUrl,
};