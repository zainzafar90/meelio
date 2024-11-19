import React, { useEffect, useMemo, useRef, useState } from "react";

import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/routes/home/components/dock/language-switcher";
import { Icons } from "@/components/icons/icons";
import { Logo } from "@/components/logo";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Clock } from "@/components/world-clock/clock";
import { useDockStore } from "@/stores/dock.store";

interface DockItem {
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
  const { isTimerVisible, toggleTimer, toggleSoundscapes, toggleBreathing } =
    useDockStore((state) => ({
      isTimerVisible: state.isTimerVisible,
      toggleTimer: state.toggleTimer,
      toggleSoundscapes: state.toggleSoundscapes,
      toggleBreathing: state.toggleBreathing,
    }));
  const { t, i18n } = useTranslation();

  const allItems: DockItem[] = useMemo(
    () => [
      {
        name: t("common.pomodoro"),
        icon: Icons.worldClock,
        activeIcon: Icons.worldClockActive,
        onClick: () => {
          toggleTimer();
        },
      },
      {
        name: t("common.soundscapes"),
        icon: Icons.soundscapes,
        activeIcon: Icons.soundscapesActive,
        onClick: () => {
          toggleSoundscapes();
        },
      },
      {
        name: t("common.breathing"),
        icon: Icons.breathing,
        activeIcon: Icons.breathingActive,
        onClick: () => {
          toggleBreathing();
        },
      },
      {
        name: t("common.settings"),
        icon: Icons.settings,
        activeIcon: Icons.settingsActive,
      },
    ],
    [t, i18n.language]
  );

  const getVisibleItemCount = (width: number) => {
    if (width >= 1280) return Math.min(allItems.length, 10);
    if (width >= 1024) return 6;
    if (width >= 768) return 3;
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
    <div className="relative" ref={dockRef}>
      <div className="rounded-2xl border border-white/10 bg-zinc-900/10 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-1">
            <SidebarTrigger
              title="Toggle Sidebar"
              className={cn(
                "flex size-12 items-center justify-center rounded-xl shadow-lg",
                "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900"
              )}
            >
              <Logo className="size-6 text-white" />
            </SidebarTrigger>

            {visibleItems.map((item, index) => (
              <DockButton
                key={index}
                icon={item.icon}
                activeIcon={item.activeIcon}
                name={item.name}
                isActive={isTimerVisible && item.name === "Pomodoro"}
                onClick={item.onClick}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <Clock />
            <LanguageSwitcher />
            <CalendarIcon />

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
          className="absolute bottom-full right-0 mb-2 min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-zinc-900/90 py-1.5 backdrop-blur-lg"
        >
          {dropdownItems.map((item, index) => {
            // TODO: load from store
            const isActive = false;
            const IconComponent = isActive ? item.activeIcon : item.icon;

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

const DockButton = ({
  icon: Icon,
  activeIcon: ActiveIcon,
  name,
  isActive,
  onClick,
  className,
}: {
  icon: React.ElementType;
  activeIcon: React.ElementType;
  name: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  const isTimerVisible = useDockStore((state) => state.isTimerVisible);
  const IconComponent =
    isActive || (name === t("common.pomodoro") && isTimerVisible)
      ? ActiveIcon
      : Icon;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "relative flex size-12 items-center justify-center rounded-xl shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:scale-105",
        "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900",
        className
      )}
      onClick={handleClick}
      title={name}
      role="button"
    >
      <IconComponent className="size-6 text-white" />
      <div className="absolute -bottom-2 h-1 w-1 rounded-full bg-zinc-500" />
    </div>
  );
};

const CalendarIcon = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const month = t(
    `common.calendar.months.short.${date
      .toLocaleString("default", { month: "short" })
      .toLowerCase()}`
  );
  const day = date.getDate();

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-zinc-800 to-zinc-900",
        "flex size-12 cursor-pointer flex-col overflow-hidden rounded-xl bg-zinc-900 shadow-lg"
      )}
      title={`${month} ${day}`}
    >
      <div className="bg-red-600 pt-0.5 text-center text-xxs font-bold uppercase text-white">
        {month}
      </div>
      <div className="flex flex-grow items-center justify-center">
        <span className="text-2xl font-light text-white">{day}</span>
      </div>
    </div>
  );
};
