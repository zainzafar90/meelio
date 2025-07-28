import { useEffect, useState } from "react";
import { soundCacheManager } from "../utils/sound-cache.utils";
import { Sound } from "../types/sound";

export function useCachedSound(sound: Sound): string {
  const [cachedUrl, setCachedUrl] = useState(sound.url);

  useEffect(() => {
    let isMounted = true;

    const loadCachedUrl = async () => {
      try {
        const url = await soundCacheManager.getSoundUrl(sound.id, sound.url);
        if (isMounted) {
          setCachedUrl(url);
        }
      } catch (error) {
        console.error("Failed to load cached sound URL:", error);
        if (isMounted) {
          setCachedUrl(sound.url); // Fallback to original URL
        }
      }
    };

    loadCachedUrl();

    return () => {
      isMounted = false;
    };
  }, [sound.id, sound.url]);

  return cachedUrl;
}