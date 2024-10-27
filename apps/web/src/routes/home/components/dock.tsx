import React, { useState, useEffect, useRef } from 'react';
import { Home, Bell, Lightbulb, Camera, Moon, Sun, Volume2, MoreHorizontal } from 'lucide-react';

interface DockItem {
  icon: React.ElementType;
  label: string;
}

export default function Dock() {
  const [visibleItems, setVisibleItems] = useState<DockItem[]>([]);
  const [dropdownItems, setDropdownItems] = useState<DockItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allItems: DockItem[] = [
    { icon: Home, label: 'Home' },
    { icon: Bell, label: 'Notifications' },
    { icon: Lightbulb, label: 'Ideas' },
    { icon: Camera, label: 'Camera' },
    { icon: Moon, label: 'Dark Mode' },
    { icon: Sun, label: 'Brightness' },
    { icon: Volume2, label: 'Volume' },
  ];

  const getVisibleItemCount = (width: number) => {
    if (width >= 1280) return allItems.length; // xl - all items
    if (width >= 1024) return 6; // lg - 6 items
    if (width >= 768) return 4; // md - 4 items
    if (width >= 640) return 3; // sm - 3 items
    return 2; // xs - 2 items
  };

  useEffect(() => {
    const handleResize = () => {
      if (!dockRef.current) return;
      const visibleCount = getVisibleItemCount(window.innerWidth);
      setVisibleItems(allItems.slice(0, visibleCount));
      setDropdownItems(allItems.slice(visibleCount));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const DockButton = ({ Icon, label }: { Icon: React.ElementType; label: string }) => (
    <button 
      className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/80 hover:text-white group relative"
      title={label}
    >
      <Icon  className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5"  />
      <span className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {label}
      </span>
    </button>
  );

  return (
    <div className="relative" ref={dockRef}>
      <div className="bg-black/80 backdrop-blur-lg rounded-full px-4 py-3 flex items-center gap-3">
        {visibleItems.map((item, index) => (
          <React.Fragment key={index}>
            <DockButton Icon={item.icon} label={item.label} />
            {(index === 3 || index === 6) && visibleItems.length > index + 1 && (
              <div className="w-px h-6 bg-white/20" />
            )}
          </React.Fragment>
        ))}
        
        {dropdownItems.length > 0 && (
          <button 
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/80 hover:text-white relative group"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <MoreHorizontal  className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5"  />
            <span className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              More Options
            </span>
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && dropdownItems.length > 0 && (
        <div 
          ref={dropdownRef}
          className="bg-black/80 backdrop-blur-lg absolute bottom-full mb-2 right-0 rounded-full overflow-hidden py-2 min-w-[200px]"
        >
          {dropdownItems.map((item, index) => (
            <button
              key={index}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-black/10 transition-colors text-white/80 hover:text-white"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}