import { useEffect, useMemo, useRef, useState } from "react";

import { SidebarTrigger } from "@repo/ui/components/ui/sidebar";
import { cn } from "@repo/ui/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Icons } from "../../../components/icons/icons";
import { Logo } from "../../../components/common/logo";
import { useDockStore } from "../../../stores/dock.store";
import { useAuthStore } from "../../../stores/auth.store";
import { useBookmarksStore } from "../../../stores/bookmarks.store";
import { useShallow } from "zustand/shallow";
import { useDockShortcuts } from "../../../hooks/use-dock-shortcuts";

import { SettingsDock } from "./components/settings.dock";
import { ClockDock } from "./components/clock.dock";
import { CalendarDock } from "./components/calendar.dock";
import { DockButton, DockItem } from "../dock-button";
import { DockOnboarding, ONBOARDING_STEPS } from "./components/dock-onboarding";

type DockIconComponent = React.ComponentType<{ className?: string }>;

const BASE_STATIC_DOCK_ITEMS: {
  id: string;
  name: string;
  icon: DockIconComponent;
  activeIcon: DockIconComponent;
  isStatic: boolean;
}[] = [
  {
    id: "calendar",
    name: "Calendar",
    icon: CalendarDock,
    activeIcon: CalendarDock,
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
    id: "settings",
    name: "Settings",
    icon: SettingsDock,
    activeIcon: SettingsDock,
    isStatic: true,
  },
];

type VisibilityState = Record<string, boolean>;

function getVisibleItemCount(width: number, itemsLength: number): number {
  if (width >= 1280) return Math.min(itemsLength, 14);
  if (width >= 1024) return 10;
  if (width >= 768) return 8;
  if (width >= 640) return 4;
  return 1;
}

export function Dock(): JSX.Element {
  useDockShortcuts();

  const [visibleItems, setVisibleItems] = useState<DockItem[]>([]);
  const [dropdownItems, setDropdownItems] = useState<DockItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dockState = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      isBreathingVisible: state.isBreathingVisible,
      isSoundscapesVisible: state.isSoundscapesVisible,
      isTasksVisible: state.isTasksVisible,
      isSiteBlockerVisible: state.isSiteBlockerVisible,
      isBackgroundsVisible: state.isBackgroundsVisible,
      isTabStashVisible: state.isTabStashVisible,
      isBookmarksVisible: state.isBookmarksVisible,
      currentOnboardingStep: state.currentOnboardingStep,
      resetDock: state.reset,
      toggleTimer: state.toggleTimer,
      toggleSoundscapes: state.toggleSoundscapes,
      toggleBreathing: state.toggleBreathing,
      toggleTasks: state.toggleTasks,
      toggleNotes: state.toggleNotes,
      toggleSiteBlocker: state.toggleSiteBlocker,
      toggleBackgrounds: state.toggleBackgrounds,
      toggleTabStash: state.toggleTabStash,
      toggleBookmarks: state.toggleBookmarks,
      dockIconsVisible: state.dockIconsVisible,
    }))
  );

  const {
    isTimerVisible,
    isBreathingVisible,
    isSoundscapesVisible,
    isTasksVisible,
    isSiteBlockerVisible,
    isBackgroundsVisible,
    isTabStashVisible,
    isBookmarksVisible,
    currentOnboardingStep,
    resetDock,
    toggleTimer,
    toggleSoundscapes,
    toggleBreathing,
    toggleTasks,
    toggleNotes,
    toggleSiteBlocker,
    toggleBackgrounds,
    toggleTabStash,
    toggleBookmarks,
    dockIconsVisible,
  } = dockState;

  const visibilityMap: VisibilityState = {
    timer: isTimerVisible,
    soundscapes: isSoundscapesVisible,
    breathepod: isBreathingVisible,
    tasks: isTasksVisible,
    "site-blocker": isSiteBlockerVisible,
    background: isBackgroundsVisible,
    "tab-stash": isTabStashVisible,
    bookmarks: isBookmarksVisible,
  };

  const { t } = useTranslation();
  const user = useAuthStore(useShallow((state) => state.user));
  const bookmarksDisplayMode = useBookmarksStore(useShallow((state) => state.displayMode));
  const showBookmarksInDock = bookmarksDisplayMode === 'sheet' || bookmarksDisplayMode === 'both';

  const staticItems = BASE_STATIC_DOCK_ITEMS;

  const items = useMemo(() => {
    const allItems = [
      { id: "home", name: t("common.home"), icon: Logo, activeIcon: Logo, onClick: resetDock, visibilityKey: null },
      { id: "timer", name: t("common.pomodoro"), icon: Icons.pomodoro, activeIcon: Icons.pomodoroActive, onClick: toggleTimer, visibilityKey: "timer" as const },
      { id: "soundscapes", name: t("common.soundscapes"), icon: Icons.soundscapes, activeIcon: Icons.soundscapesActive, onClick: toggleSoundscapes, visibilityKey: "soundscapes" as const },
      { id: "breathepod", name: t("common.breathing"), icon: Icons.breathing, activeIcon: Icons.breathingActive, onClick: toggleBreathing, visibilityKey: "breathing" as const },
      { id: "tasks", name: t("common.tasks"), icon: Icons.taskList, activeIcon: Icons.taskListActive, onClick: toggleTasks, visibilityKey: "tasks" as const },
      { id: "notes", name: t("common.notes", { defaultValue: "Notes" }), icon: Icons.note, activeIcon: Icons.noteActive, onClick: toggleNotes, visibilityKey: "notes" as const },
      { id: "site-blocker", name: t("common.site-blocker"), icon: Icons.siteBlocker, activeIcon: Icons.siteBlockerActive, onClick: toggleSiteBlocker, visibilityKey: "siteBlocker" as const },
      { id: "tab-stash", name: t("common.tab-stash"), icon: Icons.tabStash, activeIcon: Icons.tabStashActive, onClick: toggleTabStash, visibilityKey: "tabStash" as const },
      ...(showBookmarksInDock ? [{ id: "bookmarks", name: t("common.bookmarks", { defaultValue: "Bookmarks" }), icon: Icons.bookmark, activeIcon: Icons.bookmarkActive, onClick: toggleBookmarks, visibilityKey: "bookmarks" as const }] : []),
      { id: "background", name: t("common.background"), icon: Icons.background, activeIcon: Icons.background, onClick: toggleBackgrounds, visibilityKey: "backgrounds" as const },
    ];

    return allItems.filter(item =>
      item.visibilityKey === null || (dockIconsVisible[item.visibilityKey] ?? true)
    );
  }, [
    t,
    resetDock,
    toggleTimer,
    toggleSoundscapes,
    toggleBreathing,
    toggleTasks,
    toggleNotes,
    toggleSiteBlocker,
    toggleTabStash,
    toggleBackgrounds,
    toggleBookmarks,
    dockIconsVisible,
    showBookmarksInDock,
  ]);

  useEffect(() => {
    function handleResize(): void {
      if (!dockRef.current) return;
      const visibleCount = getVisibleItemCount(window.innerWidth, items.length);
      setVisibleItems(items.slice(0, visibleCount));
      setDropdownItems(items.slice(visibleCount));
    }

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
    <>
      {user && <DockOnboarding />}
      <div className="relative z-50" ref={dockRef}>
        <div className="rounded-2xl border border-white/10 bg-zinc-400/10 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 pr-1">
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
              {staticItems.map((item) => {
                const isVisible =
                  item.id === "clock"
                    ? dockIconsVisible.clock
                    : item.id === "calendar"
                      ? dockIconsVisible.calendar ?? true
                      : true;

                if (!isVisible) return null;

                const isOnboardingHighlight =
                  currentOnboardingStep >= 0 &&
                  ONBOARDING_STEPS[currentOnboardingStep].position === 9 &&
                  item.id === "settings";

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative",
                      isOnboardingHighlight &&
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
            {dropdownItems.map((item) => {
              const isActive = visibilityMap[item.id] ?? false;
              const IconComponent = (isActive ? item.activeIcon : item.icon) as DockIconComponent;

              if (item.id === "settings") {
                return (
                  <SidebarTrigger
                    key={item.id}
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
                  key={item.id}
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
    </>
  );
};
