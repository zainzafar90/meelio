import { cn } from "@repo/ui/lib/utils";
import { useDockStore } from "../../stores/dock.store";
import { ComponentType } from "react";
import { useShallow } from "zustand/shallow";

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
  const { dockIconsVisible, showIconLabels } = useDockStore(
    useShallow((state) => ({
      dockIconsVisible: state.dockIconsVisible,
      showIconLabels: state.showIconLabels,
    }))
  );

  const isVisible = dockIconsVisible[item.id];

  const isActive =
    (item.id === "timer" && dockIconsVisible.timer) ||
    (item.id === "soundscapes" && dockIconsVisible.soundscapes) ||
    (item.id === "breathepod" && dockIconsVisible.breathing) ||
    (item.id === "todos" && dockIconsVisible.todos) ||
    (item.id === "site-blocker" && dockIconsVisible.siteBlocker) ||
    (item.id === "background" && dockIconsVisible.backgrounds) ||
    (item.id === "tab-stash" && dockIconsVisible.tabStash);

  const IconComponent = isActive ? item.activeIcon : item.icon;

  const handleClick = () => {
    if (isDisabled) return;

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
