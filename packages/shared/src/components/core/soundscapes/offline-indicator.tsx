import { useEffect, useState } from "react";
import { isChromeExtension } from "../../../utils/common.utils";
import { soundCacheManager } from "../../../utils/sound-cache.utils";
import { Cloud, CloudOff, Download } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load cache size
    const loadCacheSize = async () => {
      const size = await soundCacheManager.getCacheSize();
      setCacheSize(size);
    };
    loadCacheSize();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handlePreloadSounds = async () => {
    setIsPreloading(true);
    try {
      await soundCacheManager.preloadSounds();
      const size = await soundCacheManager.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error("Failed to preload sounds:", error);
    } finally {
      setIsPreloading(false);
    }
  };

  if (!isChromeExtension()) {
    return null; // Only show for extension
  }

  const cacheSizeMB = (cacheSize / (1024 * 1024)).toFixed(1);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        {isOnline ? (
          <Cloud className="h-3 w-3 text-green-500" />
        ) : (
          <CloudOff className="h-3 w-3 text-orange-500" />
        )}
        <span className={cn(isOnline ? "text-green-500" : "text-orange-500")}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>
      
      {cacheSize > 0 && (
        <span className="text-muted-foreground">
          • {cacheSizeMB}MB cached
        </span>
      )}

      {isOnline && cacheSize === 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={handlePreloadSounds}
          disabled={isPreloading}
        >
          <Download className="mr-1 h-3 w-3" />
          {isPreloading ? "Downloading..." : "Download for offline"}
        </Button>
      )}
    </div>
  );
};