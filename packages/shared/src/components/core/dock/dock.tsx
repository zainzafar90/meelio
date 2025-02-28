import { useEffect, useMemo, useRef, useState } from "react";

import { SidebarTrigger } from "@repo/ui/components/ui/sidebar";
import { cn } from "@repo/ui/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Icons } from "../../../components/icons/icons";
import { Logo } from "../../../components/common/logo";
import { useDockStore } from "../../../stores/dock.store";
import { useAuthStore } from "../../../stores/auth.store";

import { CalendarDock } from "./components/calendar.dock";
import { SettingsDock } from "./components/settings.dock";
import { ClockDock } from "./components/clock.dock";
import { DockButton } from "../dock-button";
import { DockItem } from "../dock-button";
import { DockOnboarding, ONBOARDING_STEPS } from "./components/dock-onboarding";

type DockIconComponent = React.ComponentType<{ className?: string }>;

const STATIC_DOCK_ITEMS: {
  id: string;
  name: string;
  icon: DockIconComponent;
  activeIcon: DockIconComponent;
  isStatic: boolean;
}[] = [
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
    isTodosVisible,
    isSiteBlockerVisible,
    isBackgroundsVisible,
    isTabStashVisible,
    currentOnboardingStep,
    toggleTimer,
    toggleSoundscapes,
    toggleBreathing,
    toggleTodos,
    toggleSiteBlocker,
    toggleBackgrounds,
    toggleTabStash,
    resetDock,
    dockIconsVisible,
  } = useDockStore((state) => ({
    isTimerVisible: state.isTimerVisible,
    isBreathingVisible: state.isBreathingVisible,
    isSoundscapesVisible: state.isSoundscapesVisible,
    isTodosVisible: state.isTodosVisible,
    isSiteBlockerVisible: state.isSiteBlockerVisible,
    isBackgroundsVisible: state.isBackgroundsVisible,
    isTabStashVisible: state.isTabStashVisible,
    currentOnboardingStep: state.currentOnboardingStep,
    resetDock: state.reset,
    toggleTimer: state.toggleTimer,
    toggleSoundscapes: state.toggleSoundscapes,
    toggleBreathing: state.toggleBreathing,
    toggleTodos: state.toggleTodos,
    toggleSiteBlocker: state.toggleSiteBlocker,
    toggleBackgrounds: state.toggleBackgrounds,
    toggleTabStash: state.toggleTabStash,
    dockIconsVisible: state.dockIconsVisible,
  }));

  const { t } = useTranslation();
  const { user, guestUser } = useAuthStore((state) => ({
    user: state.user,
    guestUser: state.guestUser,
  }));

  const items = useMemo(
    () => [
      {
        id: "home",
        name: t("common.home"),
        icon: Logo,
        activeIcon: Logo,
        onClick: () => resetDock(),
      },
      ...(dockIconsVisible.timer
        ? [
            {
              id: "timer",
              name: t("common.pomodoro"),
              icon: Icons.pomodoro,
              activeIcon: Icons.pomodoroActive,
              onClick: toggleTimer,
            },
          ]
        : []),
      ...(dockIconsVisible.soundscapes
        ? [
            {
              id: "soundscapes",
              name: t("common.soundscapes"),
              icon: Icons.soundscapes,
              activeIcon: Icons.soundscapesActive,
              onClick: toggleSoundscapes,
            },
          ]
        : []),
      ...(dockIconsVisible.breathing
        ? [
            {
              id: "breathepod",
              name: t("common.breathing"),
              icon: Icons.breathing,
              activeIcon: Icons.breathingActive,
              onClick: toggleBreathing,
            },
          ]
        : []),
      ...(dockIconsVisible.todos
        ? [
            {
              id: "todos",
              name: t("common.todo"),
              icon: Icons.todoList,
              activeIcon: Icons.todoListActive,
              onClick: toggleTodos,
            },
          ]
        : []),
      ...(dockIconsVisible.siteBlocker
        ? [
            {
              id: "site-blocker",
              name: t("common.site-blocker"),
              icon: Icons.siteBlocker,
              activeIcon: Icons.siteBlockerActive,
              onClick: toggleSiteBlocker,
            },
          ]
        : []),
      ...(dockIconsVisible.tabStash
        ? [
            {
              id: "tab-stash",
              name: t("common.tab-stash"),
              icon: Icons.tabStash,
              activeIcon: Icons.tabStashActive,
              onClick: toggleTabStash,
            },
          ]
        : []),
      ...(dockIconsVisible.backgrounds
        ? [
            {
              id: "background",
              name: t("common.background"),
              icon: Icons.background,
              activeIcon: Icons.background,
              onClick: toggleBackgrounds,
            },
          ]
        : []),
    ],
    [
      t,
      resetDock,
      toggleTimer,
      toggleSoundscapes,
      toggleBreathing,
      toggleTodos,
      toggleSiteBlocker,
      toggleTabStash,
      toggleBackgrounds,
      dockIconsVisible,
    ]
  );

  const getVisibleItemCount = (width: number) => {
    if (width >= 1280) return Math.min(items.length, 14);
    if (width >= 1024) return 10;
    if (width >= 768) return 8;
    if (width >= 640) return 4;
    return 1;
  };

  useEffect(() => {
    const handleResize = () => {
      if (!dockRef.current) return;
      const visibleCount = getVisibleItemCount(window.innerWidth);
      setVisibleItems(items.slice(0, visibleCount));
      setDropdownItems(items.slice(visibleCount));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [items]);

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
    <div className="relative z-50" ref={dockRef}>
      <div className="rounded-2xl border border-white/10 bg-zinc-900/10 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-1">
            {visibleItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "relative",
                  currentOnboardingStep >= 0 &&
                    ONBOARDING_STEPS[currentOnboardingStep].position ===
                      index &&
                    "after:absolute after:inset-0 after:rounded-xl after:ring-2 after:ring-white/50 after:animate-pulse"
                )}
              >
                <DockButton item={item} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            {STATIC_DOCK_ITEMS.map((item, index) => {
              if (
                (item.id === "clock" && !dockIconsVisible.clock) ||
                (item.id === "calendar" && !dockIconsVisible.calendar)
              ) {
                return null;
              }

              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative",
                    currentOnboardingStep >= 0 &&
                      ONBOARDING_STEPS[currentOnboardingStep].position === 8 &&
                      item.id === "settings" &&
                      "after:absolute after:inset-0 after:rounded-xl after:ring-2 after:ring-white/50 after:animate-pulse"
                  )}
                >
                  <div className="flex items-center justify-center">
                    <item.icon />
                  </div>
                </div>
              );
            })}

            {dropdownItems.length > 0 && (
              <div className="group relative flex items-center justify-center">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:scale-105",
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
              (item.id === "breathepod" && isBreathingVisible) ||
              (item.id === "todos" && isTodosVisible) ||
              (item.id === "site-blocker" && isSiteBlockerVisible) ||
              (item.id === "background" && isBackgroundsVisible) ||
              (item.id === "tab-stash" && isTabStashVisible);

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

      {(user || guestUser) && <DockOnboarding />}
    </div>
  );
};
