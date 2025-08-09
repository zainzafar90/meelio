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
    showIconLabels,
  } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      isSoundscapesVisible: state.isSoundscapesVisible,
      isBreathingVisible: state.isBreathingVisible,
      isTasksVisible: state.isTasksVisible,
      isNotesVisible: (state as any).isNotesVisible,
      isSiteBlockerVisible: state.isSiteBlockerVisible,
      isBackgroundsVisible: state.isBackgroundsVisible,
      isTabStashVisible: state.isTabStashVisible,
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
    (item.id === "tab-stash" && isTabStashVisible);
  const isActive = item.isActive ?? derivedActive;

  const IconComponent = isActive ? item.activeIcon : item.icon;

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
