import { cn } from "@/lib/utils";
import { useDockStore } from "@/stores/dock.store";

export interface DockItem {
  id: string;
  name: string;
  icon: React.ElementType;
  activeIcon: React.ElementType;
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
  const { isTimerVisible, isBreathingVisible, isSoundscapesVisible } =
    useDockStore((state) => ({
      isTimerVisible: state.isTimerVisible,
      isSoundscapesVisible: state.isSoundscapesVisible,
      isBreathingVisible: state.isBreathingVisible,
    }));

  const isActive =
    (item.id === "timer" && isTimerVisible) ||
    (item.id === "soundscapes" && isSoundscapesVisible) ||
    (item.id === "breathepod" && isBreathingVisible);

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
        <div className="absolute -bottom-2 h-1 w-1 rounded-full bg-zinc-500" />
      )}
    </button>
  );
};
