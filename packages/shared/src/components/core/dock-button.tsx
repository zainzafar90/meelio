import { cn } from "@repo/ui/lib/utils";
import { useDockStore } from "../../stores/dock.store";
import { ComponentType } from "react";
import { useShallow } from "zustand/shallow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

const FEATURE_RING_CLASS_BY_ID: Record<string, string> = {
  timer: "ring-red-500/70",
  soundscapes: "ring-emerald-400/70",
  breathepod: "ring-sky-400/70",
  tasks: "ring-indigo-400/70",
  notes: "ring-amber-400/70",
  "site-blocker": "ring-purple-400/70",
  "tab-stash": "ring-sky-400/70",
  bookmarks: "ring-blue-400/70",
  background: "ring-emerald-400/70",
  home: "ring-blue-400/70",
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

export const DockButton = ({
  item,
  isDisabled,
  className,
}: {
  item: DockItem;
  isDisabled?: boolean;
  className?: string;
}) => {
  const {
    isTimerVisible,
    isSoundscapesVisible,
    isBreathingVisible,
    isTasksVisible,
    isNotesVisible,
    isSiteBlockerVisible,
    isBackgroundsVisible,
    isTabStashVisible,
    isBookmarksVisible,
    showIconLabels,
  } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      isSoundscapesVisible: state.isSoundscapesVisible,
      isBreathingVisible: state.isBreathingVisible,
      isTasksVisible: state.isTasksVisible,
      isNotesVisible: state.isNotesVisible,
      isSiteBlockerVisible: state.isSiteBlockerVisible,
      isBackgroundsVisible: state.isBackgroundsVisible,
      isTabStashVisible: state.isTabStashVisible,
      isBookmarksVisible: state.isBookmarksVisible,
      showIconLabels: state.showIconLabels,
    }))
  );

  const derivedActive =
    (item.id === "timer" && isTimerVisible) ||
    (item.id === "soundscapes" && isSoundscapesVisible) ||
    (item.id === "breathepod" && isBreathingVisible) ||
    (item.id === "tasks" && isTasksVisible) ||
    (item.id === "notes" && isNotesVisible) ||
    (item.id === "site-blocker" && isSiteBlockerVisible) ||
    (item.id === "background" && isBackgroundsVisible) ||
    (item.id === "tab-stash" && isTabStashVisible) ||
    (item.id === "bookmarks" && isBookmarksVisible);
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
        <TooltipContent>
          <p>{item.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
