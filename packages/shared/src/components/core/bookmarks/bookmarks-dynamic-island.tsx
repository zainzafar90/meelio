import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Bookmark, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useShallow } from "zustand/shallow";

import { cn } from "../../../lib/utils";
import { useBookmarksStore } from "../../../stores/bookmarks.store";
import { useCalendarStore } from "../../../stores/calendar.store";
import { useDockStore } from "../../../stores/dock.store";
import type { BookmarkNode } from "../../../types/bookmarks.types";
import { getFaviconUrl } from "../site-blocker/utils/domain.utils";

const IS_EXTENSION = typeof chrome !== "undefined" && !!chrome.storage;

interface DropdownPosition {
  top: number;
  left: number;
}

const DROPDOWN_SCROLL_STYLE: React.CSSProperties = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

const DROPDOWN_WIDTH = 288;
const DROPDOWN_HEIGHT = 320;
const DROPDOWN_PADDING = 8;

function useDropdownClickOutside(
  isOpen: boolean,
  buttonRef: React.RefObject<HTMLElement | null>,
  setIsOpen: (open: boolean) => void,
  isSubmenu = false
): void {
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent): void {
      const target = e.target as HTMLElement;
      if (target.closest("[data-bookmark-dropdown]")) return;
      if (isSubmenu && target.closest("[data-bookmark-folder]")) return;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, buttonRef, setIsOpen, isSubmenu]);
}

interface DropdownContainerProps {
  items: BookmarkNode[];
  onClose: () => void;
  position: DropdownPosition;
  zIndex?: number;
  depth?: number;
}

function DropdownContainer({
  items,
  onClose,
  position,
  zIndex = 9999,
  depth = 1,
}: DropdownContainerProps): JSX.Element {
  const showScrollHint = items.length > 8;

  return createPortal(
    <div
      data-bookmark-dropdown
      data-depth={depth}
      className="fixed w-72 bg-zinc-900/95 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl"
      style={{ top: position.top, left: position.left, zIndex }}
    >
      <div
        className="max-h-80 overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden"
        style={DROPDOWN_SCROLL_STYLE}
      >
        {items.map((item) => (
          <DropdownItem key={item.id} node={item} onClose={onClose} depth={depth} />
        ))}
      </div>
      {showScrollHint && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none rounded-b-lg flex items-end justify-center pb-1">
          <ChevronDown className="h-3 w-3 text-white/50" />
        </div>
      )}
    </div>,
    document.body
  );
}

export function BookmarksDynamicIsland(): JSX.Element | null {
  const { bookmarks, hasPermissions, displayMode } = useBookmarksStore(
    useShallow((state) => ({
      bookmarks: state.bookmarks,
      hasPermissions: state.hasPermissions,
      displayMode: state.displayMode,
    }))
  );

  const { icsUrl } = useCalendarStore(
    useShallow((state) => ({
      icsUrl: state.icsUrl,
    }))
  );

  const { dockIconsVisible } = useDockStore(
    useShallow((state) => ({
      dockIconsVisible: state.dockIconsVisible,
    }))
  );

  const showBar = displayMode === 'bar' || displayMode === 'both';
  const calendarEnabled = dockIconsVisible.calendar ?? true;
  const hasCalendar = icsUrl && calendarEnabled;

  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(20);

  const bookmarksBar = bookmarks.find(
    (node) => node.title === "Bookmarks Bar" || node.title === "Bookmarks bar"
  );
  const bookmarksBarItems = bookmarksBar?.children || [];

  const otherFolders = bookmarks.filter(
    (node) => node.title !== "Bookmarks Bar" && node.title !== "Bookmarks bar"
  );

  const updateVisibleCount = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const reservedWidth = 180;
    const itemWidth = 110;

    const availableWidth = containerWidth - reservedWidth;
    const count = Math.max(1, Math.floor(availableWidth / itemWidth));

    setVisibleCount(count);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      updateVisibleCount();
    });

    resizeObserver.observe(containerRef.current);
    updateVisibleCount();

    return () => resizeObserver.disconnect();
  }, [updateVisibleCount]);

  useEffect(() => {
    updateVisibleCount();
  }, [bookmarksBarItems.length, updateVisibleCount]);

  if (!IS_EXTENSION || !showBar || !hasPermissions) {
    return null;
  }

  if (bookmarksBarItems.length === 0 && otherFolders.length === 0) {
    return null;
  }

  const visibleItems = bookmarksBarItems.slice(0, visibleCount);
  const overflowItems = bookmarksBarItems.slice(visibleCount);
  const hasOverflow = overflowItems.length > 0;
  const hasOtherBookmarks = otherFolders.some((f) => f.children && f.children.length > 0);

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-40",
        hasCalendar ? "top-8" : "top-0"
      )}
    >
      <div
        ref={containerRef}
        className="flex items-center gap-0.5 px-2 py-1 bg-black/50 backdrop-blur-sm border-b border-white/5"
      >
        {visibleItems.map((node) => (
          <BookmarkBarItem key={node.id} node={node} />
        ))}

        {hasOverflow && (
          <OverflowDropdown items={overflowItems} />
        )}

        {hasOtherBookmarks && (
          <OtherBookmarksDropdown folders={otherFolders} />
        )}
      </div>
    </div>
  );
};

const BookmarkBarItem = ({ node }: { node: BookmarkNode }) => {
  const isFolder = !node.url;

  if (isFolder) {
    return <FolderDropdown node={node} />;
  }

  return <BookmarkLink node={node} />;
};

const BookmarkLink = ({ node, inDropdown = false, onClose }: { node: BookmarkNode; inDropdown?: boolean; onClose?: () => void }) => {
  const [showFallback, setShowFallback] = useState(false);
  const faviconUrl = node.url ? getFaviconUrl(node.url) : null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.url) {
      if (chrome?.tabs) {
        chrome.tabs.create({ url: node.url });
      } else {
        window.open(node.url, "_blank", "noopener,noreferrer");
      }
      onClose?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 rounded transition-colors text-white/80 hover:text-white hover:bg-white/10 flex-shrink-0",
        inDropdown ? "w-full px-3 py-1.5 text-left" : "px-2 py-1"
      )}
      title={node.url}
    >
      {faviconUrl && !showFallback ? (
        <img
          src={faviconUrl}
          alt=""
          className="h-4 w-4 flex-shrink-0 rounded"
          onError={() => setShowFallback(true)}
        />
      ) : (
        <Bookmark className="h-4 w-4 flex-shrink-0 text-white/50" />
      )}
      <span className={cn("text-xs truncate", inDropdown ? "max-w-52" : "max-w-24")}>
        {node.title || "Untitled"}
      </span>
    </button>
  );
};

interface FolderDropdownProps {
  node: BookmarkNode;
  isSubmenu?: boolean;
  onClose?: () => void;
  depth?: number;
}

function FolderDropdown({
  node,
  isSubmenu = false,
  onClose,
  depth = 0,
}: FolderDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    if (isSubmenu) {
      const rightSpace = window.innerWidth - rect.right;
      const leftSpace = rect.left;

      let left: number;
      if (rightSpace >= DROPDOWN_WIDTH + DROPDOWN_PADDING) {
        left = rect.right + 2;
      } else if (leftSpace >= DROPDOWN_WIDTH + DROPDOWN_PADDING) {
        left = rect.left - DROPDOWN_WIDTH - 2;
      } else {
        left = Math.max(DROPDOWN_PADDING, window.innerWidth - DROPDOWN_WIDTH - DROPDOWN_PADDING);
      }

      setDropdownPosition({
        top: Math.max(DROPDOWN_PADDING, Math.min(rect.top, window.innerHeight - DROPDOWN_HEIGHT - DROPDOWN_PADDING)),
        left,
      });
    } else {
      setDropdownPosition({
        top: rect.bottom + 2,
        left: Math.max(DROPDOWN_PADDING, Math.min(rect.left, window.innerWidth - DROPDOWN_WIDTH - DROPDOWN_PADDING)),
      });
    }
  }, [isSubmenu]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  useDropdownClickOutside(isOpen, buttonRef, setIsOpen, isSubmenu);

  const hasChildren = node.children && node.children.length > 0;
  const zIndex = 9999 + depth * 10;

  const dropdown = isOpen && hasChildren && dropdownPosition && (
    <DropdownContainer
      items={node.children || []}
      onClose={handleClose}
      position={dropdownPosition}
      zIndex={zIndex}
      depth={depth + 1}
    />
  );

  return (
    <div
      ref={buttonRef}
      data-bookmark-folder
      className="relative flex-shrink-0"
    >
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 rounded transition-colors text-white/80 hover:text-white hover:bg-white/10",
          isSubmenu ? "w-full px-3 py-1.5 text-left justify-between" : "px-2 py-1",
          isOpen && "bg-white/10"
        )}
      >
        <div className="flex items-center gap-1.5">
          <Folder className="h-4 w-4 flex-shrink-0 text-yellow-500/70" />
          <span className={cn("text-xs truncate", isSubmenu ? "max-w-36" : "max-w-24")}>
            {node.title || "Folder"}
          </span>
          {hasChildren && (
            <span className="text-[10px] text-white/40">({node.children?.length})</span>
          )}
        </div>
        {isSubmenu && hasChildren && (
          <ChevronRight className="h-3 w-3 text-white/40 flex-shrink-0 ml-2" />
        )}
      </button>
      {dropdown}
    </div>
  );
};

const DropdownItem = ({ node, onClose, depth = 1 }: { node: BookmarkNode; onClose?: () => void; depth?: number }) => {
  const isFolder = !node.url;

  if (isFolder) {
    return <FolderDropdown node={node} isSubmenu onClose={onClose} depth={depth} />;
  }

  return <BookmarkLink node={node} inDropdown onClose={onClose} />;
};

function OverflowDropdown({ items }: { items: BookmarkNode[] }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 2,
      left: Math.max(DROPDOWN_PADDING, Math.min(rect.left, window.innerWidth - DROPDOWN_WIDTH - DROPDOWN_PADDING)),
    });
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useDropdownClickOutside(isOpen, buttonRef, setIsOpen);

  const dropdown = isOpen && dropdownPosition && (
    <DropdownContainer items={items} onClose={handleClose} position={dropdownPosition} />
  );

  return (
    <div className="flex-shrink-0">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded transition-colors text-white/80 hover:text-white hover:bg-white/10",
          isOpen && "bg-white/10"
        )}
        title={`${items.length} more bookmarks`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {dropdown}
    </div>
  );
};

function OtherBookmarksDropdown({ folders }: { folders: BookmarkNode[] }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 2,
      left: Math.max(DROPDOWN_PADDING, Math.min(rect.right - DROPDOWN_WIDTH, window.innerWidth - DROPDOWN_WIDTH - DROPDOWN_PADDING)),
    });
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useDropdownClickOutside(isOpen, buttonRef, setIsOpen);

  const allItems = folders.flatMap((f) => f.children || []);

  const dropdown = isOpen && dropdownPosition && (
    <DropdownContainer items={allItems} onClose={handleClose} position={dropdownPosition} />
  );

  return (
    <div className="flex-shrink-0 ml-auto">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-white/80 hover:text-white hover:bg-white/10",
          isOpen && "bg-white/10"
        )}
      >
        <Folder className="h-4 w-4 text-yellow-500/70" />
        <span className="text-xs whitespace-nowrap">All Bookmarks</span>
        <ChevronDown className="h-3 w-3 text-white/40" />
      </button>
      {dropdown}
    </div>
  );
}
