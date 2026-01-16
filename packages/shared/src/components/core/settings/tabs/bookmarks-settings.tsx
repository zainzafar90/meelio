import { RefreshCw } from "lucide-react";
import { useShallow } from "zustand/shallow";

import { Button } from "@repo/ui/components/ui/button";
import { Switch } from "@repo/ui/components/ui/switch";
import { cn } from "@repo/ui/lib/utils";

import type { BookmarksDisplayMode } from "../../../../stores/bookmarks.store";
import { useBookmarksStore } from "../../../../stores/bookmarks.store";

const IS_EXTENSION = typeof chrome !== "undefined" && !!chrome.storage;

interface SettingsRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function SettingsRow({
  title,
  description,
  checked,
  disabled,
  onToggle,
}: SettingsRowProps): JSX.Element {
  return (
    <div
      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={() => onToggle(!checked)}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        size="sm"
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}

function formatLastSync(timestamp: number | null): string {
  if (!timestamp) return "Never";
  return new Date(timestamp).toLocaleString();
}

function computeDisplayMode(
  showBar: boolean,
  showSheet: boolean
): BookmarksDisplayMode {
  if (showBar && showSheet) return "both";
  if (showBar) return "bar";
  if (showSheet) return "sheet";
  return "hidden";
}

export function BookmarksSettings(): JSX.Element {
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

  const showBar = displayMode === "bar" || displayMode === "both";
  const showSheet = displayMode === "sheet" || displayMode === "both";

  const handleBarToggle = (enabled: boolean) => {
    setDisplayMode(computeDisplayMode(enabled, showSheet));
  };

  const handleSheetToggle = (enabled: boolean) => {
    setDisplayMode(computeDisplayMode(showBar, enabled));
  };

  if (!IS_EXTENSION) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Bookmarks settings are only available in the browser extension.
        </p>
      </div>
    );
  }

  const permissionDescription = hasPermissions
    ? `${links.length} bookmarks synced`
    : "Grant permission to access your browser bookmarks";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4 transition-colors">
        <div className="space-y-1">
          <p className="text-sm font-medium">Bookmarks Permission</p>
          <p className="text-sm text-muted-foreground">{permissionDescription}</p>
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

      <SettingsRow
        title="Bookmarks Bar"
        description="Show bookmarks in a bar at the top of the page"
        checked={showBar}
        disabled={!hasPermissions}
        onToggle={handleBarToggle}
      />

      <SettingsRow
        title="Bookmarks in Dock"
        description="Show bookmarks icon in dock to open side panel"
        checked={showSheet}
        disabled={!hasPermissions}
        onToggle={handleSheetToggle}
      />

      {hasPermissions && lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          Last synced: {formatLastSync(lastSyncAt)}
        </p>
      )}
    </div>
  );
}
