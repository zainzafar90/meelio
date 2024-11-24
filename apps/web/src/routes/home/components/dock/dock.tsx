import React, { useEffect, useMemo, useRef, useState } from "react";

import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { ClockDock } from "@/routes/home/components/dock/components/clock.dock";
import { LanguageSwitcherDock } from "@/routes/home/components/dock/components/language-switcher.dock";
import { TodoListSheet } from "@/routes/home/components/todo-list/components/todo-list.sheet";
import { Icons } from "@/components/icons/icons";
import { Logo } from "@/components/logo";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useDockStore } from "@/stores/dock.store";
import { useTodoStore } from "@/stores/todo.store";

import { CalendarDock } from "./components/calendar.dock";

interface DockItem {
  id: string;
  name: string;
  icon: React.ElementType;
  activeIcon: React.ElementType;
  hidden?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export const Dock = () => {
  const [visibleItems, setVisibleItems] = useState<DockItem[]>([]);
  const [dropdownItems, setDropdownItems] = useState<DockItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    isTimerVisible,
    isBreathingVisible,
    isSoundscapesVisible,
    toggleTimer,
    toggleSoundscapes,
    toggleBreathing,
    resetDock,
  } = useDockStore((state) => ({
    isTimerVisible: state.isTimerVisible,
    isSoundscapesVisible: state.isSoundscapesVisible,
    isBreathingVisible: state.isBreathingVisible,
    resetDock: state.reset,
    toggleTimer: state.toggleTimer,
    toggleSoundscapes: state.toggleSoundscapes,
    toggleBreathing: state.toggleBreathing,
  }));
  const { t, i18n } = useTranslation();

  const allItems: DockItem[] = useMemo(
    () => [
      {
        id: "home",
        name: t("common.home"),
        icon: Logo,
        activeIcon: Logo,
        onClick: () => {
          resetDock();
        },
      },
      {
        id: "timer",
        name: t("common.pomodoro"),
        icon: Icons.worldClock,
        activeIcon: Icons.worldClockActive,
        onClick: () => {
          toggleTimer();
        },
      },
      {
        id: "soundscapes",
        name: t("common.soundscapes"),
        icon: Icons.soundscapes,
        activeIcon: Icons.soundscapesActive,
        onClick: () => {
          toggleSoundscapes();
        },
      },
      {
        id: "breathepod",
        name: t("common.breathing"),
        icon: Icons.breathing,
        activeIcon: Icons.breathingActive,
        onClick: () => {
          toggleBreathing();
        },
      },
      {
        id: "settings",
        name: t("common.settings"),
        icon: Icons.settings,
        activeIcon: Icons.settingsActive,
      },
      // {
      //   id: "todo",
      //   name: t("common.todo"),
      //   icon: Icons.todoList,
      //   activeIcon: Icons.todoListActive,
      //   onClick: () => {
      //     useTodoStore.getState().setIsVisible(true);
      //   },
      // },
    ],
    [t, i18n.language]
  );

  const getVisibleItemCount = (width: number) => {
    if (width >= 1280) return Math.min(allItems.length, 10);
    if (width >= 768) return 6;
    if (width >= 640) return 1;
    return 1;
  };

  useEffect(() => {
    const handleResize = () => {
      if (!dockRef.current) return;
      const visibleCount = getVisibleItemCount(window.innerWidth);
      setVisibleItems(allItems.slice(0, visibleCount));
      setDropdownItems(allItems.slice(visibleCount));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [allItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative" ref={dockRef}>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/10 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pr-1">
              {visibleItems.map((item, index) => (
                <DockButton key={index} item={item} />
              ))}
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <ClockDock />
              <CalendarDock />
              <LanguageSwitcherDock />

              {dropdownItems.length > 0 && (
                <div className="group relative flex items-center justify-center">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-xl shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:scale-105",
                      "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900"
                    )}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    title="More Options"
                  >
                    <MoreHorizontal className="size-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isDropdownOpen && dropdownItems.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute bottom-full right-0 z-50 mb-2 min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-zinc-900/90 py-1.5 backdrop-blur-lg"
          >
            {dropdownItems.map((item, index) => {
              const isActive =
                (item.id === "timer" && isTimerVisible) ||
                (item.id === "soundscapes" && isSoundscapesVisible) ||
                (item.id === "breathepod" && isBreathingVisible);

              const IconComponent = isActive ? item.activeIcon : item.icon;

              if (item.id === "settings") {
                return (
                  <SidebarTrigger
                    key={index}
                    title="Toggle Sidebar"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <IconComponent className="size-5" />
                    <span className="text-xs">{item.name}</span>
                  </SidebarTrigger>
                );
              }

              return (
                <button
                  key={index}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={item.onClick}
                >
                  <IconComponent className="size-5" />
                  <span className="text-xs">{item.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <TodoListSheet />
    </>
  );
};

const DockButton = ({
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

  if (item.id === "settings") {
    return (
      <SidebarTrigger
        title="Toggle Sidebar"
        className={cn(
          "flex size-12 items-center justify-center rounded-xl shadow-lg",
          "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900"
        )}
      >
        <IconComponent className="size-6 text-white" />
      </SidebarTrigger>
    );
  }

  return (
    <button
      className={cn(
        "relative flex size-12 items-center justify-center rounded-xl shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:scale-105",
        "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900",
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
