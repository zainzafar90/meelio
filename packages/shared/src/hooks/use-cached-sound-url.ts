import { useEffect, useState, useRef } from "react";
import { soundSyncService } from "../services/sound-sync.service";

/**
 * Hook to get a cached sound URL with automatic fallback
 */
export function useCachedSoundUrl(path: string): string {
  const [url, setUrl] = useState<string>("");
  const prevUrlRef = useRef<string>("");

  useEffect(() => {
    let isMounted = true;

    const loadUrl = async () => {
      try {
        const soundUrl = await soundSyncService.getSoundUrl(path);
        
        if (isMounted) {
          // Clean up previous blob URL if it exists
          if (prevUrlRef.current && prevUrlRef.current.startsWith('blob:')) {
            soundSyncService.cleanupBlobUrl(prevUrlRef.current);
          }
          
          prevUrlRef.current = soundUrl;
          setUrl(soundUrl);
        }
      } catch (error) {
        console.error("Failed to load sound URL:", error);
        // Fallback to network URL on error
        if (isMounted) {
          setUrl(path);
        }
      }
    };

    loadUrl();

    return () => {
      isMounted = false;
      // Cleanup blob URL on unmount
      if (prevUrlRef.current && prevUrlRef.current.startsWith('blob:')) {
        soundSyncService.cleanupBlobUrl(prevUrlRef.current);
      }
    };
  }, [path]);

  return url;
}