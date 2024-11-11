import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { Clock, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { Logo } from "@/components/logo";
import { useDockStore } from "@/stores/dock.store";

interface DockItem {
  name: string;
  href: string;
  icon: React.ElementType;
  activeIcon: React.ElementType;
  hidden?: boolean;
  isActive?: boolean;
}

const useNotification = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);
  return { isExpanded, toggleExpand };
};

export const Dock = () => {
  const [visibleItems, setVisibleItems] = useState<DockItem[]>([]);
  const [dropdownItems, setDropdownItems] = useState<DockItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { isTimerVisible } = useDockStore((state) => ({
    isTimerVisible: state.isTimerVisible,
  }));

  const allItems: DockItem[] = [
    {
      name: "Home",
      href: "/",
      icon: Logo,
      activeIcon: Logo,
    },

    {
      name: "Pomodoro",
      href: "/pomodoro",
      icon: Icons.worldClock,
      activeIcon: Icons.worldClockActive,
    },
    {
      name: "Breathepod",
      href: "/breathing",
      icon: Icons.breathing,
      activeIcon: Icons.breathingActive,
    },
    {
      name: "Soundscapes",
      href: "/soundscapes",
      icon: Icons.soundscapes,
      activeIcon: Icons.soundscapesActive,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Icons.settings,
      activeIcon: Icons.settingsActive,
    },
  ];

  const getVisibleItemCount = (width: number) => {
    if (width >= 1280) return allItems.length;
    if (width >= 1024) return 6;
    if (width >= 768) return 4;
    return 3;
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
  }, []);

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
      <div className="flex h-[68px] items-center gap-2 rounded-full bg-black/80 px-3 backdrop-blur-lg [color-scheme:dark]">
        {visibleItems.map((item, index) => (
          <React.Fragment key={index}>
            <DockButton
              icon={item.icon}
              activeIcon={item.activeIcon}
              name={item.name}
              isActive={item.isActive}
            />
            {(index === 3 || index === 6) &&
              visibleItems.length > index + 1 && (
                <div className="h-5 w-px bg-white/20" />
              )}
          </React.Fragment>
        ))}

        <div className="h-5 w-px bg-white/20" />
        <NotificationButton />

        {dropdownItems.length > 0 && (
          <button
            className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <MoreHorizontal className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            <span className="pointer-events-none absolute -top-7 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              More Options
            </span>
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && dropdownItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full right-0 mb-2 min-w-[180px] overflow-hidden rounded-lg bg-black/80 py-1.5 backdrop-blur-lg [color-scheme:dark]"
        >
          {dropdownItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const IconComponent = isActive ? item.activeIcon : item.icon;

            return (
              <button
                key={index}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-white/80 transition-colors hover:bg-black/10 hover:text-white"
              >
                <IconComponent className="h-4 w-4" />
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
}: {
  icon: React.ElementType;
  activeIcon: React.ElementType;
  name: string;
  isActive?: boolean;
}) => {
  const { toggleTimer } = useDockStore((state) => ({
    toggleTimer: state.toggleTimer,
  }));
  const IconComponent = isActive ? ActiveIcon : Icon;

  const handleClick = () => {
    if (name === "Pomodoro") {
      toggleTimer();
    }
  };

  return (
    <button
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors [color-scheme:dark] hover:bg-white/20",
        isActive ? "text-white" : "text-white/80"
      )}
      title={name}
      onClick={handleClick}
    >
      <IconComponent className="size-4 md:size-5 lg:size-5" />
      <span className="pointer-events-none absolute -top-7 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity [color-scheme:dark] group-hover:opacity-100">
        {name}
      </span>
    </button>
  );
};

const NotificationButton = () => {
  const { isExpanded, toggleExpand } = useNotification();

  return (
    <div className="relative flex items-center">
      <div
        className={`transition-all duration-300 ease-out ${
          isExpanded ? "w-[320px]" : "w-10"
        }`}
      >
        <div
          onClick={toggleExpand}
          className={`${
            isExpanded
              ? "absolute left-0 top-1/2 flex h-[68px] -translate-y-1/2 items-center gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/70 px-4"
              : "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-b from-indigo-400 to-indigo-500 transition-colors hover:from-indigo-300 hover:to-indigo-400"
          } shadow-xl backdrop-blur-xl`}
        >
          {!isExpanded ? (
            <Clock className="h-5 w-5 text-white" />
          ) : (
            <>
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-500">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex w-full items-center gap-1 truncate">
                  <h3 className="text-sm font-medium text-zinc-200">
                    Time Check
                  </h3>
                  <span className="text-xs text-zinc-400">reminder</span>
                </div>
                <p className="w-full truncate text-sm font-medium text-zinc-100">
                  Take a break,{" "}
                  <span className="font-normal text-zinc-400">
                    stretch a little
                  </span>
                  <span className="ml-1">⏰</span>
                </p>
              </div>
              <div className="ml-2 flex-shrink-0">
                <div className="h-1 w-1 rounded-full bg-zinc-600" />
                <div className="mt-1 h-1 w-1 rounded-full bg-zinc-600" />
                <div className="mt-1 h-1 w-1 rounded-full bg-zinc-600" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
