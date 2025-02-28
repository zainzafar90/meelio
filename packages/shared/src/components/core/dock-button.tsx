import { cn } from "@repo/ui/lib/utils";
import { useDockStore } from "../../stores/dock.store";
import { ComponentType } from "react";

export interface DockItem {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  activeIcon: ComponentType<{ className?: string }>;
  hidden?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  isStatic?: boolean;
}

export const DockButton = ({
  item,
  className,
}: {
  item: DockItem;
  className?: string;
}) => {
  const {
    isTimerVisible,
    isBreathingVisible,
    isSoundscapesVisible,
    isTodosVisible,
    isSiteBlockerVisible,
    isBackgroundsVisible,
    isTabStashVisible,
    showIconLabels,
  } = useDockStore((state) => ({
    isTimerVisible: state.isTimerVisible,
    isSoundscapesVisible: state.isSoundscapesVisible,
    isBreathingVisible: state.isBreathingVisible,
    isTodosVisible: state.isTodosVisible,
    isSiteBlockerVisible: state.isSiteBlockerVisible,
    isBackgroundsVisible: state.isBackgroundsVisible,
    isTabStashVisible: state.isTabStashVisible,
    showIconLabels: state.showIconLabels,
  }));

  const isActive =
    (item.id === "timer" && isTimerVisible) ||
    (item.id === "soundscapes" && isSoundscapesVisible) ||
    (item.id === "breathepod" && isBreathingVisible) ||
    (item.id === "todos" && isTodosVisible) ||
    (item.id === "site-blocker" && isSiteBlockerVisible) ||
    (item.id === "background" && isBackgroundsVisible) ||
    (item.id === "tab-stash" && isTabStashVisible);

  const IconComponent = isActive ? item.activeIcon : item.icon;

  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <button
      className={cn(
        "cursor-pointer",
        "relative flex size-10 items-center justify-center rounded-xl shadow-lg",
        "bg-gradient-to-b from-zinc-800 to-zinc-900",
        className
      )}
      onClick={handleClick}
      title={item.name}
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
  );
};
