import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { EntityType, useSyncStore } from "../stores/sync.store";

interface SyncStatusProps {
  entityType?: EntityType;
  className?: string;
}

export function SyncStatus({
  entityType = "task",
  className,
}: SyncStatusProps) {
  const { isOnline, syncingEntities, getQueue, lastSyncTimes } = useSyncStore();

  const isSyncing = syncingEntities.has(entityType);
  const queue = getQueue(entityType);
  const pendingCount = queue.length;
  const lastSyncTime = lastSyncTimes[entityType] || null;

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "";

    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Synced";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className={cn("flex items-center gap-2 text-xs mr-6", className)}>
      {/* Sync Status */}
      {isSyncing ? (
        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Syncing...</span>
        </div>
      ) : pendingCount > 0 ? (
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <span>{pendingCount} pending</span>
        </div>
      ) : lastSyncTime ? (
        <span className="text-muted-foreground">
          {formatLastSync(lastSyncTime)}
        </span>
      ) : null}

      {/* Online/Offline */}
      <div
        className={cn(
          "flex items-center gap-1",
          isOnline ? "text-green-600 dark:text-green-400" : "text-gray-500"
        )}
      >
        {isOnline ? (
          <Cloud className="h-3 w-3" />
        ) : (
          <CloudOff className="h-3 w-3" />
        )}
      </div>
    </div>
  );
}
