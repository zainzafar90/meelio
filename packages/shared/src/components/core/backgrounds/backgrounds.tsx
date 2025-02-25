import { useState } from "react";

import { cn } from "@repo/ui/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

import { Blurhash } from "../../../components";
import {
  LiveWallpaper,
  StaticWallpaper,
  useBackgroundStore,
} from "../../../stores";

const LiveWallpaperComponent = ({
  wallpaper,
}: {
  wallpaper: LiveWallpaper;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="blurhash-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Blurhash
              hash={wallpaper.blurhash}
              width={32}
              height={32}
              className="h-full w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.video
        key={wallpaper.video.src}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeIn" }}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={wallpaper.video.fallbackImage}
        onLoadedData={() => setIsLoaded(true)}
      >
        <source src={wallpaper.video.src} type="video/mp4" />
        <img
          src={wallpaper.video.fallbackImage}
          alt={wallpaper.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </motion.video>
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
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="static-blurhash-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Blurhash
              hash={wallpaper.blurhash}
              width={32}
              height={32}
              className="h-full w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

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
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeIn" }}
          src={`${wallpaper.url}?w=1920&q=80&auto=format`}
          alt={wallpaper.title}
          className="h-full w-full object-cover"
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
