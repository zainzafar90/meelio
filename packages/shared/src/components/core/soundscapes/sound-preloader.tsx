import { useEffect } from "react";
import { soundCacheManager } from "../../../utils/sound-cache.utils";
import { isChromeExtension } from "../../../utils/common.utils";

export const SoundPreloader = () => {
  useEffect(() => {
    if (!isChromeExtension()) return;

    const preloadSounds = async () => {
      try {
        await soundCacheManager.preloadSounds();
      } catch (error) {
        console.error("Failed to preload sounds:", error);
      }
    };

    // Preload sounds when component mounts (extension starts)
    preloadSounds();

    // Also preload when network comes back online
    const handleOnline = () => {
      if (navigator.onLine) {
        preloadSounds();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};