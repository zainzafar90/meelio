import { Play } from "lucide-react";
import type { Wallpaper } from "../../../../stores/background.store";
import { cn } from "../../../../lib";

interface WallpaperTileProps {
  wallpaper: Wallpaper;
  isSelected: boolean;
  onSelect: (wallpaper: Wallpaper) => void;
  size?: "small" | "medium";
}

export function WallpaperTile({
  wallpaper,
  isSelected,
  onSelect,
  size = "small",
}: WallpaperTileProps) {
  const aspectClass = size === "small" ? "aspect-[4/3]" : "aspect-video";
  
  return (
    <button
      onClick={() => onSelect(wallpaper)}
      className={cn(
        "group relative overflow-hidden rounded-md",
        "border transition-all hover:border-white/50",
        aspectClass,
        isSelected
          ? "border-white/50 ring-1 ring-white/30"
          : "border-white/20"
      )}
    >
      <picture>
        <source
          srcSet={`${wallpaper.type === "live" 
            ? wallpaper.thumbnail || wallpaper.video?.fallbackImage
            : wallpaper.thumbnail || wallpaper.url
          }${wallpaper.source.includes("unsplash") ? "&dpr=2" : ""}`}
          media="(-webkit-min-device-pixel-ratio: 2)"
        />
        <img
          src={
            wallpaper.type === "live"
              ? wallpaper.thumbnail || wallpaper.video?.fallbackImage
              : wallpaper.thumbnail || wallpaper.url
          }
          alt={wallpaper.title}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </picture>
      
      {wallpaper.type === "live" && (
        <div className="absolute left-1.5 top-1.5 rounded-full bg-black/50 p-1">
          <Play className="h-3 w-3 fill-white text-white" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex flex-col justify-end h-full">
          <p className="text-xs font-medium text-white line-clamp-2">
            {wallpaper.title}
          </p>
          <p className="text-xs text-white/70 line-clamp-1">
            {wallpaper.author}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {wallpaper.source === "local" && (
              <span className="inline-block rounded-full bg-white/20 px-1.5 py-0.5 text-xs text-white">
                Default
              </span>
            )}
            {wallpaper.source === "custom" && (
              <span className="inline-block rounded-full bg-blue-500/50 px-1.5 py-0.5 text-xs text-white">
                Custom
              </span>
            )}
            {wallpaper.type === "live" && (
              <span className="inline-block rounded-full bg-purple-500/50 px-1.5 py-0.5 text-xs text-white">
                Live
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}