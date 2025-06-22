import { Play } from "lucide-react";
import type { Wallpaper } from "../../../../stores/background.store";
import { cn } from "../../../../lib";

interface CurrentWallpaperDisplayProps {
  wallpaper: Wallpaper;
  className?: string;
}

export function CurrentWallpaperDisplay({
  wallpaper,
  className,
}: CurrentWallpaperDisplayProps) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10", className)}>
      <div className="relative flex-shrink-0 w-16 h-10 rounded overflow-hidden">
        <img
          src={
            wallpaper.type === "live"
              ? wallpaper.thumbnail || wallpaper.video?.fallbackImage
              : wallpaper.thumbnail || wallpaper.url
          }
          alt={wallpaper.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {wallpaper.type === "live" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-black/50 p-1">
              <Play className="h-2 w-2 fill-white text-white" />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {wallpaper.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-white/70 truncate">
            {wallpaper.author}
          </p>
          {wallpaper.type === "live" && (
            <span className="text-xs text-white/50">• Live</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {wallpaper.source === "local" && (
            <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
              Default
            </span>
          )}
          {wallpaper.source === "custom" && (
            <span className="inline-block rounded-full bg-blue-500/50 px-2 py-0.5 text-xs text-white">
              Custom
            </span>
          )}
        </div>
      </div>
    </div>
  );
}