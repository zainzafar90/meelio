import { Switch } from "@repo/ui/components/ui/switch";
import { Button } from "@repo/ui/components/ui/button";
import { useBookmarksStore } from "../../../../stores/bookmarks.store";
import { useShallow } from "zustand/shallow";
import { RefreshCw } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

const isExtension = typeof chrome !== "undefined" && !!chrome.storage;

export const BookmarksSettings = () => {
  const {
    hasPermissions,
    displayMode,
    setDisplayMode,
    requestPermissions,
    refreshBookmarks,
    isLoading,
    links,
    lastSyncAt,
  } = useBookmarksStore(
    useShallow((state) => ({
      hasPermissions: state.hasPermissions,
      displayMode: state.displayMode,
      setDisplayMode: state.setDisplayMode,
      requestPermissions: state.requestPermissions,
      refreshBookmarks: state.refreshBookmarks,
      isLoading: state.isLoading,
      links: state.links,
      lastSyncAt: state.lastSyncAt,
    }))
  );

  const showBar = displayMode === 'bar' || displayMode === 'both';
  const showSheet = displayMode === 'sheet' || displayMode === 'both';

  const handleBarToggle = (enabled: boolean) => {
    if (enabled) {
      setDisplayMode(showSheet ? 'both' : 'bar');
    } else {
      setDisplayMode(showSheet ? 'sheet' : 'hidden');
    }
  };

  const handleSheetToggle = (enabled: boolean) => {
    if (enabled) {
      setDisplayMode(showBar ? 'both' : 'sheet');
    } else {
      setDisplayMode(showBar ? 'bar' : 'hidden');
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isExtension) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Bookmarks settings are only available in the browser extension.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4 transition-colors">
        <div className="space-y-1">
          <p className="text-sm font-medium">Bookmarks Permission</p>
          <p className="text-sm text-muted-foreground">
            {hasPermissions
              ? `${links.length} bookmarks synced`
              : "Grant permission to access your browser bookmarks"
            }
          </p>
        </div>
        {hasPermissions ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshBookmarks()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("size-4 mr-2", isLoading && "animate-spin")} />
            Sync
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestPermissions()}
            disabled={isLoading}
          >
            Grant Access
          </Button>
        )}
      </div>

      <div
        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => handleBarToggle(!showBar)}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium">Bookmarks Bar</p>
          <p className="text-sm text-muted-foreground">
            Show bookmarks in a bar at the top of the page
          </p>
        </div>
        <Switch
          size="sm"
          checked={showBar}
          onCheckedChange={handleBarToggle}
          disabled={!hasPermissions}
        />
      </div>

      <div
        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => handleSheetToggle(!showSheet)}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium">Bookmarks in Dock</p>
          <p className="text-sm text-muted-foreground">
            Show bookmarks icon in dock to open side panel
          </p>
        </div>
        <Switch
          size="sm"
          checked={showSheet}
          onCheckedChange={handleSheetToggle}
          disabled={!hasPermissions}
        />
      </div>

      {hasPermissions && lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          Last synced: {formatLastSync(lastSyncAt)}
        </p>
      )}
    </div>
  );
};
