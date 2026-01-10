import { cn } from "@repo/ui/lib/utils";
import { useDockStore } from "../../stores/dock.store";
import type { ComponentType } from "react";
import { useShallow } from "zustand/shallow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { isMacPlatform } from "../../utils/common.utils";

const FEATURE_RING_CLASS_BY_ID: Record<string, string> = {
  timer: "ring-red-500/70",
  soundscapes: "ring-emerald-400/70",
  breathepod: "ring-sky-400/70",
  tasks: "ring-indigo-400/70",
  notes: "ring-amber-400/70",
  "site-blocker": "ring-purple-400/70",
  "tab-stash": "ring-sky-400/70",
  bookmarks: "ring-blue-400/70",
  weather: "ring-cyan-400/70",
  background: "ring-emerald-400/70",
  home: "ring-blue-400/70",
};

const SHORTCUT_BY_ID: Record<string, string> = {
  timer: "1",
  breathepod: "2",
  soundscapes: "3",
  tasks: "4",
  notes: "5",
  "site-blocker": "6",
  "tab-stash": "7",
  bookmarks: "8",
  background: "9",
  calendar: "0",
};

export interface DockItem {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  activeIcon: ComponentType<{ className?: string }>;
  hidden?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  isStatic?: boolean;
  requirePro?: boolean;
}

interface DockButtonProps {
  item: DockItem;
  isDisabled?: boolean;
  className?: string;
}

const VISIBILITY_STATE_BY_ID: Record<string, string> = {
  timer: "isTimerVisible",
  soundscapes: "isSoundscapesVisible",
  breathepod: "isBreathingVisible",
  tasks: "isTasksVisible",
  notes: "isNotesVisible",
  "site-blocker": "isSiteBlockerVisible",
  background: "isBackgroundsVisible",
  "tab-stash": "isTabStashVisible",
  bookmarks: "isBookmarksVisible",
  weather: "isWeatherVisible",
};

export function DockButton({ item, isDisabled, className }: DockButtonProps): React.ReactElement {
  const { showIconLabels, ...visibilityStates } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      isSoundscapesVisible: state.isSoundscapesVisible,
      isBreathingVisible: state.isBreathingVisible,
      isTasksVisible: state.isTasksVisible,
      isNotesVisible: state.isNotesVisible,
      isSiteBlockerVisible: state.isSiteBlockerVisible,
      isBackgroundsVisible: state.isBackgroundsVisible,
      isTabStashVisible: state.isTabStashVisible,
      isBookmarksVisible: (state as any).isBookmarksVisible,
      isWeatherVisible: (state as any).isWeatherVisible,
      showIconLabels: state.showIconLabels,
    }))
  );

  const visibilityKey = VISIBILITY_STATE_BY_ID[item.id];
  const derivedActive = visibilityKey
    ? (visibilityStates as Record<string, boolean>)[visibilityKey]
    : false;
  const isActive = item.isActive ?? derivedActive;

  const IconComponent = isActive ? item.activeIcon : item.icon;

  const shouldShowActiveRing =
    isActive && !["calendar", "clock", "settings"].includes(item.id);
  const ringClassName = shouldShowActiveRing
    ? `ring-2 ${FEATURE_RING_CLASS_BY_ID[item.id] ?? "ring-white/60"}`
    : "";

  const handleClick = () => {
    if (isDisabled) return;

    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "cursor-pointer",
              "relative flex size-10 items-center justify-center rounded-xl shadow-lg",
              "bg-gradient-to-b from-zinc-800 to-zinc-900",
              ringClassName,
              className
            )}
            onClick={handleClick}
            role="button"
          >
            <IconComponent className="size-6 text-white" />
            {item.requirePro && (
              <span
                className={cn(
                  "absolute -top-1 -right-2 z-10 bg-sky-600 text-[6px] font-bold uppercase tracking-wider text-white/90 px-1 py-0.5 rounded border border-white/10"
                )}
              >
                Pro
              </span>
            )}
            {isActive && (
              <div className="absolute -bottom-3 h-1 w-1 rounded-full bg-zinc-500" />
            )}
            {showIconLabels && (
              <span className="absolute -bottom-3 text-muted-foreground">
                <span className="text-[7px] leading-none">{item.name}</span>
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-3 py-1.5 px-2.5">
          <span className="text-sm">{item.name}</span>
          {SHORTCUT_BY_ID[item.id] && (
            <div className="flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-mono font-medium text-zinc-300 bg-zinc-700/80 border border-zinc-600 rounded shadow-sm">
                {isMacPlatform() ? "\u2318" : "\u2303"}
              </kbd>
              <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono font-medium text-zinc-300 bg-zinc-700/80 border border-zinc-600 rounded shadow-sm">
                {SHORTCUT_BY_ID[item.id]}
              </kbd>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
