import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { Logo } from "@/components/logo";
import { CategoryList } from "@/components/soundscape/categories/category-list";
import { SoundList } from "@/components/soundscape/sound-list/sound-list";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useDockStore } from "@/stores/dock.store";

interface DockItem {
  name: string;
  href: string;
  icon: React.ElementType;
  activeIcon: React.ElementType;
  hidden?: boolean;
  isActive?: boolean;
}

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
      name: "Soundscapes",
      href: "/soundscapes",
      icon: Icons.soundscapes,
      activeIcon: Icons.soundscapesActive,
    },
    {
      name: "Breathepod",
      href: "/breathing",
      icon: Icons.breathing,
      activeIcon: Icons.breathingActive,
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
      <div className="rounded-2xl border border-white/10 bg-zinc-900/10 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-1">
            {visibleItems.slice(0, -1).map((item, index) => (
              <DockButton
                key={index}
                icon={item.icon}
                activeIcon={item.activeIcon}
                name={item.name}
                isActive={isTimerVisible && item.name === "Pomodoro"}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            {visibleItems.slice(-1).map((item, index) => (
              <DockButton
                key={index}
                icon={item.icon}
                activeIcon={item.activeIcon}
                name={item.name}
                isActive={isTimerVisible && item.name === "Pomodoro"}
              />
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
          className="absolute bottom-full right-0 mb-2 min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-zinc-900/90 py-1.5 backdrop-blur-lg"
        >
          {dropdownItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const IconComponent = isActive ? item.activeIcon : item.icon;

            return (
              <button
                key={index}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
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

  if (name === "Soundscapes") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="group relative flex cursor-pointer items-center justify-center">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-xl shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:scale-105",
                "bg-gradient-to-b from-zinc-800 to-zinc-900"
              )}
              title={name}
            >
              <IconComponent className="size-6 text-white" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="h-[80vh] max-w-lg p-0">
          <div className="flex h-full flex-col overflow-hidden p-6">
            <CategoryList />
            <div className="flex-1 overflow-y-auto">
              <SoundList />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleClick = () => {
    if (name === "Pomodoro") {
      toggleTimer();
    }
  };

  return (
    <div className="group relative flex cursor-pointer items-center justify-center">
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-xl shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:scale-105",
          "bg-gradient-to-b from-zinc-800 to-zinc-900"
        )}
        onClick={handleClick}
        title={name}
      >
        <IconComponent className="size-6 text-white" />
      </div>
    </div>
  );
};
