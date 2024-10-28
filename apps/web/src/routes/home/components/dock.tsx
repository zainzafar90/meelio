import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom"; // Add this import

import { MoreHorizontal } from "lucide-react";

import { Icons } from "@/components/icons/icons";
import { Logo } from "@/components/logo";

interface DockItem {
  name: string;
  href: string;
  icon: React.ElementType;
  activeIcon: React.ElementType;
  hidden?: boolean;
}

export const Dock = () => {
  const [visibleItems, setVisibleItems] = useState<DockItem[]>([]);
  const [dropdownItems, setDropdownItems] = useState<DockItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

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
      icon: Icons.pomodoro,
      activeIcon: Icons.pomodoroActive,
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
      name: "World Clock",
      href: "/world-clock",
      icon: Icons.worldClock,
      activeIcon: Icons.worldClockActive,
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

  const DockButton = ({
    href,
    icon: Icon,
    activeIcon: ActiveIcon,
    name,
  }: {
    href: string;
    icon: React.ElementType;
    activeIcon: React.ElementType;
    name: string;
  }) => {
    const isActive = location.pathname === href;
    const IconComponent = isActive ? ActiveIcon : Icon;

    return (
      <button
        className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/80 hover:text-white group relative"
        title={name}
      >
        <IconComponent className="size-3 md:size-4 lg:size-5" />
        <span className="absolute -top-7 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {name}
        </span>
      </button>
    );
  };

  return (
    <div className="relative" ref={dockRef}>
      <div className="bg-black/80 backdrop-blur-lg rounded-full px-3 py-2 flex items-center gap-2">
        {visibleItems.map((item, index) => (
          <React.Fragment key={index}>
            <DockButton
              href={item.href}
              icon={item.icon}
              activeIcon={item.activeIcon}
              name={item.name}
            />
            {(index === 3 || index === 6) &&
              visibleItems.length > index + 1 && (
                <div className="w-px h-5 bg-white/20" />
              )}
          </React.Fragment>
        ))}

        {dropdownItems.length > 0 && (
          <button
            className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/80 hover:text-white relative group"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <MoreHorizontal className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
            <span className="absolute -top-7 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              More Options
            </span>
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && dropdownItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="bg-black/80 backdrop-blur-lg absolute bottom-full mb-2 right-0 rounded-lg overflow-hidden py-1.5 min-w-[180px]"
        >
          {dropdownItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const IconComponent = isActive ? item.activeIcon : item.icon;

            return (
              <button
                key={index}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-black/10 transition-colors text-white/80 hover:text-white"
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-xs">{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
