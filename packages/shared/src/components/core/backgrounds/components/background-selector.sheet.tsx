import { Button } from "@repo/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Play, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import axios from "axios";

import { cn } from "../../../../lib";
import { Icons } from "../../../../components/icons/icons";
import { useDockStore } from "../../../../stores/dock.store";
import { useAuthStore } from "../../../../stores/auth.store";
import {
  useBackgroundStore,
  Wallpaper,
} from "../../../../stores/background.store";

export const BackgroundSelectorSheet = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isBackgroundsVisible, toggleBackgrounds } = useDockStore();
  const { wallpapers, currentWallpaper, setCurrentWallpaper, resetToDefault } =
    useBackgroundStore();

  const [apiBackgrounds, setApiBackgrounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch backgrounds from API if user is logged in
  useEffect(() => {
    if (user) {
      fetchBackgrounds();
    }
  }, [user]);

  const fetchBackgrounds = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/v1/backgrounds");
      setApiBackgrounds(response.data);
    } catch (error) {
      console.error("Error fetching backgrounds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Combine local wallpapers with API backgrounds
  const allBackgrounds = [...wallpapers, ...apiBackgrounds];

  const liveWallpapers = allBackgrounds.filter((w) => w.type === "live");
  const staticWallpapers = allBackgrounds.filter((w) => w.type === "static");

  const handleSetBackground = async (background: Wallpaper) => {
    // Set in local store
    setCurrentWallpaper(background);

    // If user is logged in, also set in API
    if (user && background.id) {
      try {
        await axios.post("/api/v1/backgrounds/selected", {
          backgroundId: background.id,
        });
      } catch (error) {
        console.error("Error setting background in API:", error);
      }
    }
  };

  const handleRandomBackground = async () => {
    if (user) {
      try {
        const response = await axios.get("/api/v1/backgrounds/random");
        const randomBackground = response.data;

        // Convert API background format to local format if needed
        const wallpaper: Wallpaper = {
          id: randomBackground.id,
          type: randomBackground.type,
          title: randomBackground.metadata?.name || "Random Background",
          author: randomBackground.metadata?.category || "Unknown",
          thumbnail:
            randomBackground.metadata?.thumbnailUrl || randomBackground.url,
          blurhash: "",
          source: "unsplash",
          url: randomBackground.type === "static" ? randomBackground.url : "",
          ...(randomBackground.type === "live" && {
            video: {
              src: randomBackground.url,
              fallbackImage: randomBackground.metadata?.thumbnailUrl || "",
            },
          }),
        };

        handleSetBackground(wallpaper);
      } catch (error) {
        console.error("Error getting random background:", error);

        // Fallback to local random background
        const randomIndex = Math.floor(Math.random() * wallpapers.length);
        handleSetBackground(wallpapers[randomIndex]);
      }
    } else {
      // If not logged in, use local random background
      const randomIndex = Math.floor(Math.random() * wallpapers.length);
      handleSetBackground(wallpapers[randomIndex]);
    }
  };

  const handleResetToDefault = () => {
    resetToDefault();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Sheet open={isBackgroundsVisible} onOpenChange={toggleBackgrounds}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("backgrounds.title")}</SheetTitle>
          <SheetDescription>{t("backgrounds.description")}</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {/* Live Wallpapers Section */}
          {liveWallpapers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/70">
                {t("backgrounds.liveWallpapers")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {liveWallpapers.map((wallpaper) => (
                  <button
                    key={wallpaper.id}
                    onClick={() => handleSetBackground(wallpaper)}
                    className={cn(
                      "group relative aspect-video overflow-hidden rounded-lg",
                      "border-2 transition-all hover:border-white/50",
                      currentWallpaper?.id === wallpaper.id
                        ? "border-white/50"
                        : "border-transparent"
                    )}
                  >
                    <img
                      src={
                        wallpaper.thumbnail || wallpaper.video?.fallbackImage
                      }
                      alt={wallpaper.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute left-2 top-2 rounded-full bg-black/50 p-1">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-sm font-medium text-white">
                        {wallpaper.title}
                      </p>
                      <p className="text-xs text-white/70">
                        {wallpaper.author} • Live
                      </p>
                      {wallpaper.source === "local" && (
                        <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                          Default
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Static Wallpapers Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">
              {t("backgrounds.staticWallpapers")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {staticWallpapers.map((wallpaper) => (
                <button
                  key={wallpaper.id}
                  onClick={() => handleSetBackground(wallpaper)}
                  className={cn(
                    "group relative aspect-video overflow-hidden rounded-lg",
                    "border-2 transition-all hover:border-white/50",
                    currentWallpaper?.id === wallpaper.id
                      ? "border-white/50"
                      : "border-transparent"
                  )}
                >
                  <picture>
                    <source
                      srcSet={`${wallpaper.thumbnail || wallpaper.url}&dpr=2`}
                      media="(-webkit-min-device-pixel-ratio: 2)"
                    />
                    <img
                      src={wallpaper.thumbnail || wallpaper.url}
                      alt={wallpaper.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-black/40 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-sm font-medium text-white">
                      {wallpaper.title}
                    </p>
                    <p className="text-xs text-white/70">{wallpaper.author}</p>
                    {wallpaper.source === "local" && (
                      <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                        Default
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRandomBackground}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("backgrounds.randomBackground")}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResetToDefault}
          >
            <Icons.reset className="mr-2 h-4 w-4" />
            {t("backgrounds.resetToDefault")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
