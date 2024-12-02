import { useEffect, useMemo, useRef, useState } from "react";

import { SidebarTrigger } from "@repo/ui/components/ui/sidebar";
import { cn } from "@repo/ui/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ClockDock } from "@/routes/home/components/dock/components/clock.dock";
import { LanguageSwitcherDock } from "@/routes/home/components/dock/components/language-switcher.dock";
import { Icons } from "@/components/icons/icons";
import { Logo } from "@/components/logo";
import { useDockStore } from "@/stores/dock.store";

import { DockButton, DockItem } from "../dock-button";
import { BackgroundDock } from "./components/background.dock";
import { CalendarDock } from "./components/calendar.dock";
import { SettingsDock } from "./components/settings.dock";

type DockIconComponent = React.ComponentType<{ className?: string }>;

const STATIC_DOCK_ITEMS: {
  id: string;
  name: string;
  icon: DockIconComponent;
  activeIcon: DockIconComponent;
  isStatic: boolean;
}[] = [
  {
    id: "background",
    name: "Background",
    icon: BackgroundDock,
    activeIcon: BackgroundDock,
    isStatic: true,
  },
  {
    id: "clock",
    name: "Clock",
    icon: ClockDock,
    activeIcon: ClockDock,
    isStatic: true,
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: CalendarDock,
    activeIcon: CalendarDock,
    isStatic: true,
  },
  {
    id: "language",
    name: "Language",
    icon: LanguageSwitcherDock,
    activeIcon: LanguageSwitcherDock,
    isStatic: true,
  },
  {
    id: "settings",
    name: "Settings",
    icon: SettingsDock,
    activeIcon: SettingsDock,
    isStatic: true,
  },
];

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
    toggleTodos,
    resetDock,
  } = useDockStore((state) => ({
    isTimerVisible: state.isTimerVisible,
    isSoundscapesVisible: state.isSoundscapesVisible,
    isBreathingVisible: state.isBreathingVisible,
    resetDock: state.reset,
    toggleTimer: state.toggleTimer,
    toggleSoundscapes: state.toggleSoundscapes,
    toggleBreathing: state.toggleBreathing,
    toggleTodos: state.toggleTodos,
  }));
  const { t } = useTranslation();

  const mainDockItems: DockItem[] = useMemo(
    () => [
      {
        id: "home",
        name: t("common.home"),
        icon: Logo,
        activeIcon: Logo,
        onClick: () => resetDock(),
      },
      {
        id: "timer",
        name: t("common.pomodoro"),
        icon: Icons.worldClock,
        activeIcon: Icons.worldClockActive,
        onClick: () => toggleTimer(),
      },
      {
        id: "soundscapes",
        name: t("common.soundscapes"),
        icon: Icons.soundscapes,
        activeIcon: Icons.soundscapesActive,
        onClick: () => toggleSoundscapes(),
      },
      {
        id: "breathepod",
        name: t("common.breathing"),
        icon: Icons.breathing,
        activeIcon: Icons.breathingActive,
        onClick: () => toggleBreathing(),
      },
      {
        id: "todo",
        name: t("common.todo"),
        icon: Icons.todoList,
        activeIcon: Icons.todoListActive,
        onClick: () => toggleTodos(),
      },
    ],
    [t, resetDock, toggleTimer, toggleSoundscapes, toggleBreathing]
  );

  const getVisibleItemCount = (width: number) => {
    if (width >= 1280) return Math.min(mainDockItems.length, 14);
    if (width >= 1024) return 10;
    if (width >= 768) return 6;
    if (width >= 640) return 4;
    return 1;
  };

  useEffect(() => {
    const handleResize = () => {
      if (!dockRef.current) return;
      const visibleCount = getVisibleItemCount(window.innerWidth);
      setVisibleItems(mainDockItems.slice(0, visibleCount));
      setDropdownItems(mainDockItems.slice(visibleCount));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mainDockItems]);

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
    <div className="relative" ref={dockRef}>
      <div className="rounded-2xl border border-white/10 bg-zinc-900/10 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-1">
            {visibleItems.map((item, index) => (
              <DockButton key={index} item={item} />
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            {STATIC_DOCK_ITEMS.map((item) => (
              <div key={item.id} className="flex items-center justify-center">
                <item.icon />
              </div>
            ))}

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

            const IconComponent = (
              isActive ? item.activeIcon : item.icon
            ) as DockIconComponent;

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
  );
};
