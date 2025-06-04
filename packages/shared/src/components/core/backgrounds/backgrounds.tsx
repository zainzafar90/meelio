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

      <motion.video
        key={wallpaper.url}
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
        <source src={wallpaper.url} type="video/mp4" />
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
  return (
    <div className="relative h-full w-full">
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

      <div className="absolute inset-0">
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
            key={wallpaper.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeIn" }}
            src={`${wallpaper.url}`}
            alt={wallpaper.title}
            className="h-full w-full object-cover"
            loading="eager"
          />
        </picture>
      </div>
    </div>
  );
};

export const Background = () => {
  const wallpaper = useBackgroundStore((state) => state.getWallpaper());

  if (!wallpaper) return null;

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={wallpaper.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeIn" }}
        className={cn(
          "fixed inset-0 bg-blue-300",
          "m-0 p-0 transition-transform duration-300 ease-out"
        )}
      >
        {wallpaper.type === "live" ? (
          <LiveWallpaperComponent wallpaper={wallpaper} />
        ) : (
          <StaticWallpaperComponent wallpaper={wallpaper} />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
