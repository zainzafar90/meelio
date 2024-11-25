import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Blurhash } from "@/components/ui/blurhash";
import {
  LiveWallpaper,
  StaticWallpaper,
  useBackgroundStore,
} from "@/stores/background.store";

const LiveWallpaperComponent = ({
  wallpaper,
}: {
  wallpaper: LiveWallpaper;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative h-full w-full">
      {!isLoaded && (
        <Blurhash
          hash={wallpaper.blurhash}
          width={32}
          height={32}
          className="absolute inset-0 h-full w-full"
        />
      )}
      <video
        key={wallpaper.video.src}
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          !isLoaded && "opacity-0",
          "transition-opacity duration-500"
        )}
        autoPlay
        muted
        loop
        playsInline
        poster={wallpaper.video.fallbackImage}
      >
        <source src={wallpaper.video.src} type="video/mp4" />
        <img
          src={wallpaper.video.fallbackImage}
          alt={wallpaper.title}
          className="absolute inset-0 h-full w-full object-cover"
          onLoad={() => setIsLoaded(true)}
        />
      </video>
    </div>
  );
};

const StaticWallpaperComponent = ({
  wallpaper,
}: {
  wallpaper: StaticWallpaper;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative h-full w-full">
      {!isLoaded && (
        <Blurhash
          hash={wallpaper.blurhash}
          width={32}
          height={32}
          className="absolute inset-0 h-full w-full"
        />
      )}
      <picture>
        <source
          media="(max-width: 640px)"
          srcSet={`${wallpaper.url}?w=640&q=80&auto=format`}
        />
        <source
          media="(max-width: 1024px)"
          srcSet={`${wallpaper.url}?w=1024&q=80&auto=format`}
        />
        <source
          media="(max-width: 1920px)"
          srcSet={`${wallpaper.url}?w=1920&q=80&auto=format`}
        />
        <source
          media="(min-width: 1921px)"
          srcSet={`${wallpaper.url}?w=3840&q=80&auto=format`}
        />
        <img
          src={`${wallpaper.url}?w=1920&q=80&auto=format`}
          alt={wallpaper.title}
          className={cn(
            "h-full w-full object-cover",
            !isLoaded && "opacity-0",
            "transition-opacity duration-500"
          )}
          loading="eager"
          onLoad={() => setIsLoaded(true)}
        />
      </picture>
    </div>
  );
};

export const Background = () => {
  const { currentWallpaper } = useBackgroundStore();

  if (!currentWallpaper) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentWallpaper.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "absolute inset-0 bg-transparent",
          "m-0 p-0 transition-transform duration-300 ease-out"
        )}
      >
        {currentWallpaper.type === "live" ? (
          <LiveWallpaperComponent wallpaper={currentWallpaper} />
        ) : (
          <StaticWallpaperComponent wallpaper={currentWallpaper} />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
