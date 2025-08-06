import { useEffect, useState } from "react";
import { soundSyncService, SoundSyncProgress } from "../../../services/sound-sync.service";
import { Progress } from "@repo/ui/components/ui/progress";

export const SoundSyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncProgress, setSyncProgress] = useState<SoundSyncProgress>({
    total: 0,
    downloaded: 0,
    isComplete: false,
  });

  useEffect(() => {

    const updateStatus = async () => {
      const progress = soundSyncService.getSyncStatus();
      setSyncProgress(progress);
      
      if (progress.isComplete) {
        const size = await soundSyncService.getCacheSize();
        console.log(`[SoundSync] Cache size: ${(size / (1024 * 1024)).toFixed(1)}MB`);
      }
    };

    updateStatus();

    // Update every 5 seconds during sync
    const interval = setInterval(updateStatus, 5000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncPercentage = syncProgress.total > 0 
    ? Math.round((syncProgress.downloaded / syncProgress.total) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Offline message - only show if no sounds downloaded */}
      {!isOnline && syncProgress.total > 0 && syncProgress.downloaded === 0 && (
        <div className="p-2 rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground">
            Connect to the internet to download sounds for offline use
          </p>
        </div>
      )}

      {/* Sync Progress - only show when actively syncing */}
      {isOnline && !syncProgress.isComplete && syncProgress.total > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Downloading sounds...
            </span>
            <span className="text-muted-foreground">{syncPercentage}%</span>
          </div>
          <Progress value={syncPercentage} className="h-1" />
        </div>
      )}

    </div>
  );
};