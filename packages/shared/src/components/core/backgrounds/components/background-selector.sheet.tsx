import { Button } from "@repo/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Play, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "../../../../lib";
import { Icons } from "../../../../components/icons/icons";
import { useDockStore } from "../../../../stores/dock.store";
import { useAuthStore } from "../../../../stores/auth.store";
import {
  useBackgrounds,
  useUpdateBackground,
  useCreateBackground,
} from "../../../../lib/hooks/useBackgrounds";

export const BackgroundSelectorSheet = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isBackgroundsVisible, toggleBackgrounds } = useDockStore();
  const { data: backgrounds, isLoading } = useBackgrounds(user?.id || "");
  const { mutate: updateBackground } = useUpdateBackground();
  const { mutate: createBackground } = useCreateBackground();

  const liveWallpapers = backgrounds?.filter((w) => w.type === "video") || [];
  const staticWallpapers = backgrounds?.filter((w) => w.type === "image") || [];

  const handleSetBackground = (background: (typeof backgrounds)[0]) => {
    if (!user) return;

    updateBackground({
      id: background.id,
      data: { isFavorite: true },
    });
  };

  const handleAddBackground = async () => {
    if (!user) return;

    // TODO: Implement file upload and create new background
    createBackground({
      name: "Custom Background",
      url: "...",
      type: "image",
      category: "custom",
      tags: [],
      userId: user.id,
      isCustom: true,
      isFavorite: false,
    });
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
                      wallpaper.isFavorite
                        ? "border-white/50"
                        : "border-transparent"
                    )}
                  >
                    <img
                      src={wallpaper.thumbnailUrl || wallpaper.url}
                      alt={wallpaper.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute left-2 top-2 rounded-full bg-black/50 p-1">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-sm font-medium text-white">
                        {wallpaper.name}
                      </p>
                      <p className="text-xs text-white/70">
                        {wallpaper.category} • Live
                      </p>
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
                    wallpaper.isFavorite
                      ? "border-white/50"
                      : "border-transparent"
                  )}
                >
                  <picture>
                    <source
                      srcSet={`${wallpaper.thumbnailUrl || wallpaper.url}&dpr=2`}
                      media="(-webkit-min-device-pixel-ratio: 2)"
                    />
                    <img
                      src={wallpaper.thumbnailUrl || wallpaper.url}
                      alt={wallpaper.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-black/40 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-sm font-medium text-white">
                      {wallpaper.name}
                    </p>
                    <p className="text-xs text-white/70">
                      {wallpaper.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddBackground}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("backgrounds.addNew")}
          </Button>
        </div>

        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={() => {
            // TODO: Implement reset to default
          }}
        >
          <Icons.reset className="mr-2 h-4 w-4" />
          {t("backgrounds.resetToDefault")}
        </Button>
      </SheetContent>
    </Sheet>
  );
};
