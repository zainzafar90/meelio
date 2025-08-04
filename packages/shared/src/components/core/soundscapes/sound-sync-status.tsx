import { useEffect, useState } from "react";
import { Progress } from "@repo/ui/components/ui/progress";
import { useSoundSyncProgress } from "./use-sound-sync-progress";

export interface OfflineMessageProps {}

const OfflineMessage: React.FC<OfflineMessageProps> = () => (
  <div className="p-2 rounded-md bg-muted/50">
    <p className="text-xs text-muted-foreground">
      Connect to the internet to download sounds for offline use
    </p>
  </div>
);

export interface SyncProgressProps {
  readonly value: number;
}

const SyncProgress: React.FC<SyncProgressProps> = ({ value }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">Downloading sounds...</span>
      <span className="text-muted-foreground">{value}%</span>
    </div>
    <Progress value={value} className="h-1" />
  </div>
);

export interface SoundSyncStatusProps {}

/**
 * Display progress of cached sound downloads.
 */
export const SoundSyncStatus: React.FC<SoundSyncStatusProps> = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const progress = useSoundSyncProgress();
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
  const percent =
    progress.total > 0
      ? Math.round((progress.downloaded / progress.total) * 100)
      : 0;
  return (
    <div className="flex flex-col gap-2">
      {!isOnline && progress.total > 0 && progress.downloaded === 0 && (
        <OfflineMessage />
      )}
      {isOnline && !progress.isComplete && progress.total > 0 && (
        <SyncProgress value={percent} />
      )}
    </div>
  );
};
