import { isChromeExtension } from "./common.utils";
import { soundCacheManager } from "./sound-cache.utils";

/**
 * Get a sound URL that works both online and offline
 * For extensions: Returns cached URL if available, otherwise original URL
 * For webapp: Always returns original URL
 */
export async function getCachedSoundUrl(soundId: number | string, originalUrl: string): Promise<string> {
  if (!isChromeExtension()) {
    // Web app always uses original URLs
    return originalUrl;
  }

  // Extension uses cached URL if available
  return soundCacheManager.getSoundUrl(soundId, originalUrl);
}

/**
 * Create a sound data object with cached URL support
 * This is useful if you want to create sounds dynamically
 */
export function createCachedSound(sound: {
  id: number;
  name: string;
  url: string;
  [key: string]: any;
}) {
  return {
    ...sound,
    getCachedUrl: () => getCachedSoundUrl(sound.id, sound.url),
  };
}