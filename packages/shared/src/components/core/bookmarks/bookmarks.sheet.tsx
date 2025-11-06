import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { useDockStore } from "../../../stores/dock.store";
import { useBookmarksStore } from "../../../stores/bookmarks.store";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { useShallow } from "zustand/shallow";
import { Icons } from "../../../components/icons/icons";
import {
  ExternalLink,
  RefreshCw,
  Bookmark,
  Folder,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useState } from "react";
import type { BookmarkNode } from "../../../types/bookmarks.types";
import { getFaviconUrl } from "../site-blocker/utils/domain.utils";

const isExtension = typeof chrome !== "undefined" && !!chrome.storage;

export function BookmarksSheet() {
  const { t } = useTranslation();
  const { isBookmarksVisible, toggleBookmarks } = useDockStore(
    useShallow((state) => ({
      isBookmarksVisible: (state as any).isBookmarksVisible ?? false,
      toggleBookmarks: (state as any).toggleBookmarks ?? (() => {}),
    }))
  );

  return (
    <Sheet open={isBookmarksVisible} onOpenChange={toggleBookmarks}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl border-l border-white/10 bg-zinc-900 backdrop-blur-xl"
      >
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>
              {t("bookmarks.title", { defaultValue: "Bookmarks" })}
            </SheetTitle>
            <SheetDescription>
              {t("bookmarks.description", {
                defaultValue: "Manage your bookmarks",
              })}
            </SheetDescription>
          </SheetHeader>
        </VisuallyHidden>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {t("bookmarks.title", { defaultValue: "Bookmarks" })}
          </h2>
        </div>

        {isExtension ? (
          <ExtensionBookmarksContent />
        ) : (
          <BrowserBookmarksContent />
        )}
      </SheetContent>
    </Sheet>
  );
}

const ExtensionBookmarksContent = () => {
  const { t } = useTranslation();
  const {
    bookmarks,
    links,
    folders,
    hasPermissions,
    isLoading,
    checkPermissions,
    requestPermissions,
    initializeStore,
    refreshBookmarks,
  } = useBookmarksStore(
    useShallow((state) => ({
      bookmarks: state.bookmarks,
      links: state.links,
      folders: state.folders,
      hasPermissions: state.hasPermissions,
      isLoading: state.isLoading,
      checkPermissions: state.checkPermissions,
      requestPermissions: state.requestPermissions,
      initializeStore: state.initializeStore,
      refreshBookmarks: state.refreshBookmarks,
    }))
  );

  useEffect(() => {
    const initialize = async () => {
      const hasPerms = await checkPermissions();
      if (hasPerms) {
        await initializeStore();
      }
    };
    initialize();
  }, [checkPermissions, initializeStore]);

  const handleOpenLink = (url: string) => {
    if (chrome?.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleRequestPermissions = async () => {
    try {
      console.log("Requesting bookmarks permission...");
      const granted = await requestPermissions();
      console.log("Permission request result:", granted);
      if (granted) {
        console.log("Permission granted, initializing store...");
        await initializeStore();
      } else {
        console.warn("Permission not granted");
      }
    } catch (error) {
      console.error("Failed to request permissions:", error);
    }
  };

  if (!hasPermissions) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Bookmark className="h-12 w-12 text-white/40" />
        <div className="text-lg text-white">
          {t("bookmarks.needs-permission", {
            defaultValue: "Bookmarks permission required",
          })}
        </div>
        <Button
          onClick={handleRequestPermissions}
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
              {t("common.loading", { defaultValue: "Loading..." })}
            </>
          ) : (
            t("bookmarks.grant-permission", {
              defaultValue: "Grant Permission",
            })
          )}
        </Button>
      </div>
    );
  }

  if (isLoading && links.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Icons.spinner className="h-6 w-6 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshBookmarks}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          {t("bookmarks.refresh", { defaultValue: "Refresh" })}
        </Button>
        <div className="text-sm text-white/60">
          {links.length} {t("bookmarks.links", { defaultValue: "links" })}
          {folders.length > 0 &&
            ` • ${folders.length} ${t("bookmarks.folders", { defaultValue: "folders" })}`}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center text-white/60">
            <Bookmark className="h-12 w-12 text-white/20" />
            <div>
              {t("bookmarks.empty", { defaultValue: "No bookmarks found" })}
            </div>
          </div>
        ) : (
          <BookmarkTree nodes={bookmarks} onLinkClick={handleOpenLink} />
        )}
      </div>
    </div>
  );
};

const BookmarkTreeNode = ({
  node,
  onLinkClick,
  level = 0,
  expandedFolders,
  onToggleFolder,
}: {
  node: BookmarkNode;
  onLinkClick: (url: string) => void;
  level: number;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
}) => {
  const isFolder = !node.url;
  const isExpanded = expandedFolders.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  if (isFolder) {
    return (
      <div className="mb-1">
        <button
          onClick={() => onToggleFolder(node.id)}
          className={cn(
            "flex items-center gap-2 w-full p-2 rounded-lg",
            "hover:bg-white/5 transition-colors text-left",
            level > 0 && "pl-6"
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-white/60" />
            ) : (
              <ChevronRight className="h-3 w-3 text-white/60" />
            )
          ) : (
            <div className="w-3" />
          )}
          <Folder className="h-4 w-4 text-white/60" />
          <span className="text-sm font-medium text-white/80 truncate">
            {node.title}
          </span>
          {hasChildren && (
            <span className="text-xs text-white/40">
              ({node.children?.length})
            </span>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {node.children?.map((child) => (
              <BookmarkTreeNode
                key={child.id}
                node={child}
                onLinkClick={onLinkClick}
                level={level + 1}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const faviconUrl = node.url ? getFaviconUrl(node.url) : null;
  const [showFallback, setShowFallback] = useState(false);

  return (
    <button
      onClick={() => onLinkClick(node.url!)}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-lg mb-1",
        "hover:bg-white/5 transition-colors",
        "text-left border border-transparent hover:border-white/10",
        level > 0 && "pl-6"
      )}
    >
      {faviconUrl && !showFallback ? (
        <img
          src={faviconUrl}
          alt=""
          className="h-4 w-4 flex-shrink-0 rounded"
          onError={() => setShowFallback(true)}
        />
      ) : (
        <Bookmark className="h-4 w-4 flex-shrink-0 text-white/40" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {node.title}
        </div>
        <div className="text-xs text-white/60 truncate">{node.url}</div>
      </div>
      <ExternalLink className="h-4 w-4 flex-shrink-0 text-white/40" />
    </button>
  );
};

const BookmarkTree = ({
  nodes,
  onLinkClick,
}: {
  nodes: BookmarkNode[];
  onLinkClick: (url: string) => void;
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <BookmarkTreeNode
          key={node.id}
          node={node}
          onLinkClick={onLinkClick}
          level={0}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
        />
      ))}
    </div>
  );
};

const BrowserBookmarksContent = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <Bookmark className="h-12 w-12 text-white/40" />
      <div className="text-lg text-white">
        {t("bookmarks.extension-only", {
          defaultValue: "Bookmarks available in extension only",
        })}
      </div>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() =>
          window.open(
            "https://chromewebstore.google.com/detail/meelio/cjcgnlglboofgepielbmjcepcdohipaj",
            "_blank",
            "noopener,noreferrer"
          )
        }
      >
        {t("bookmarks.get-extension", { defaultValue: "Get Extension" })}
      </Button>
    </div>
  );
};
