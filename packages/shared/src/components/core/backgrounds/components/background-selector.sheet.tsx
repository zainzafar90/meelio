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

import { cn } from "../../../../lib";
import { Icons } from "../../../../components/icons/icons";
import { useDockStore } from "../../../../stores/dock.store";
import { useAuthStore } from "../../../../stores/auth.store";
import {
  useBackgroundStore,
  Wallpaper,
} from "../../../../stores/background.store";
import * as backgroundsApi from "../../../../api/backgrounds.api";
import { useShallow } from "zustand/shallow";

export function BackgroundSelectorSheet() {
  const { t } = useTranslation();
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );
  const { isBackgroundsVisible, toggleBackgrounds } = useDockStore(
    useShallow((state) => ({
      isBackgroundsVisible: state.isBackgroundsVisible,
      toggleBackgrounds: state.toggleBackgrounds,
    }))
  );
  const { setCurrentWallpaper, currentWallpaper } = useBackgroundStore(
    useShallow((state) => ({
      setCurrentWallpaper: state.setCurrentWallpaper,
      currentWallpaper: state.currentWallpaper,
    }))
  );
  const { wallpapers, resetToDefault, initializeWallpapers, isLoading } =
    useBackgroundStore(
      useShallow((state) => ({
        wallpapers: state.wallpapers,
        resetToDefault: state.resetToDefault,
        initializeWallpapers: state.initializeWallpapers,
        isLoading: state.isLoading,
      }))
    );

  const liveWallpapers = wallpapers.filter((w) => w.type === "live");
  const staticWallpapers = wallpapers.filter((w) => w.type === "static");

  const handleSetBackground = async (background: Wallpaper) => {
    setCurrentWallpaper(background);

    if (user && background.id) {
      try {
        const response = await backgroundsApi.setFavouriteBackground(
          background.id
        );
        if (response.data && response.data.backgrounds) {
          initializeWallpapers();
        }
      } catch (error) {
        console.error("Error setting background in API:", error);
      }
    }
  };

  const handleRandomBackground = () => {
    const randomIndex = Math.floor(Math.random() * wallpapers.length);
    const randomWallpaper = wallpapers[randomIndex];
    setCurrentWallpaper(randomWallpaper);
  };

  const handleResetToDefault = () => {
    resetToDefault();
  };

  if (isLoading) {
    return (
      <Sheet open={isBackgroundsVisible} onOpenChange={toggleBackgrounds}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t("backgrounds.title")}</SheetTitle>
            <SheetDescription>{t("backgrounds.description")}</SheetDescription>
          </SheetHeader>
          <div className="flex items-center justify-center h-full">
            <Icons.spinner className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading backgrounds...</span>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isBackgroundsVisible} onOpenChange={toggleBackgrounds}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-hidden flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>{t("backgrounds.title")}</SheetTitle>
          <SheetDescription>{t("backgrounds.description")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex gap-2">
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

        <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2">
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
                        {(wallpaper.source === "local" ||
                          wallpaper.source === "api-default") && (
                          <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                            Default
                          </span>
                        )}
                        {wallpaper.source === "custom" && (
                          <span className="mt-1 inline-block rounded-full bg-blue-500/50 px-2 py-0.5 text-xs text-white">
                            Custom
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
                        srcSet={`${wallpaper.thumbnail || wallpaper.url}${wallpaper.source.includes("unsplash") ? "&dpr=2" : ""}`}
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
                      <p className="text-xs text-white/70">
                        {wallpaper.author}
                      </p>
                      {(wallpaper.source === "local" ||
                        wallpaper.source === "api-default") && (
                        <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                          Default
                        </span>
                      )}
                      {wallpaper.source === "custom" && (
                        <span className="mt-1 inline-block rounded-full bg-blue-500/50 px-2 py-0.5 text-xs text-white">
                          Custom
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
