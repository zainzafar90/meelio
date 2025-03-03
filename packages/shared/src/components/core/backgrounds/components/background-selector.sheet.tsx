import { Button } from "@repo/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Play, RefreshCw, Upload, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "../../../../lib";
import { Icons } from "../../../../components/icons/icons";
import { useDockStore } from "../../../../stores/dock.store";
import { useAuthStore } from "../../../../stores/auth.store";
import {
  useBackgroundStore,
  Wallpaper,
  // WallpaperSource,
} from "../../../../stores/background.store";
// import { v4 as uuidv4 } from "uuid";
import * as backgroundsApi from "../../../../api/backgrounds.api";

export const BackgroundSelectorSheet = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isBackgroundsVisible, toggleBackgrounds } = useDockStore();
  const {
    wallpapers,
    currentWallpaper,
    setCurrentWallpaper,
    resetToDefault,
    // addWallpaper,
    initializeWallpapers,
    isLoading,
  } = useBackgroundStore();

  // const [uploadingImage, setUploadingImage] = useState(false);
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter wallpapers by type
  const liveWallpapers = wallpapers.filter((w) => w.type === "live");
  const staticWallpapers = wallpapers.filter((w) => w.type === "static");

  const handleSetBackground = async (background: Wallpaper) => {
    setCurrentWallpaper(background);

    if (user && background.id) {
      try {
        await backgroundsApi.setSelectedBackground(background.id);
      } catch (error) {
        console.error("Error setting background in API:", error);
      }
    }
  };

  const handleRandomBackground = async () => {
    if (user) {
      try {
        const response = await backgroundsApi.getRandomBackground();

        initializeWallpapers();

        if (response.data && response.data.id) {
          await backgroundsApi.setSelectedBackground(response.data.id);
          initializeWallpapers();
        }
      } catch (error) {
        console.error("Error getting random background:", error);
        const randomIndex = Math.floor(Math.random() * wallpapers.length);
        handleSetBackground(wallpapers[randomIndex]);
      }
    } else {
      const randomIndex = Math.floor(Math.random() * wallpapers.length);
      handleSetBackground(wallpapers[randomIndex]);
    }
  };

  const handleResetToDefault = () => {
    resetToDefault();
  };

  // const handleUploadClick = () => {
  //   fileInputRef.current?.click();
  // };

  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   setUploadingImage(true);

  //   try {
  //     // Create a local URL for the file
  //     const imageUrl = URL.createObjectURL(file);
  //     const fileName = file.name.split(".")[0] || "Custom Background";

  //     // Create a new wallpaper
  //     const newWallpaper: Wallpaper = {
  //       id: uuidv4(),
  //       type: "static",
  //       title: fileName,
  //       author: "You",
  //       thumbnail: imageUrl,
  //       blurhash: "",
  //       source: "custom" as WallpaperSource,
  //       url: imageUrl,
  //     };

  //     // Add to local store
  //     addWallpaper(newWallpaper);

  //     // If user is logged in, also upload to API
  //     if (user) {
  //       try {
  //         await backgroundsApi.createBackground({
  //           type: "static",
  //           url: imageUrl,
  //           metadata: {
  //             name: fileName,
  //             category: "Custom",
  //             tags: ["custom"],
  //             thumbnailUrl: imageUrl,
  //           },
  //         });
  //         // Refresh backgrounds
  //         initializeWallpapers();
  //       } catch (uploadError) {
  //         console.error("Error uploading to API:", uploadError);
  //       }
  //     }

  //     // Set as current background
  //     handleSetBackground(newWallpaper);
  //   } catch (error) {
  //     console.error("Error uploading image:", error);
  //   } finally {
  //     setUploadingImage(false);
  //     // Reset the file input
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = "";
  //     }
  //   }
  // };

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
          {/* <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <Button
              variant="outline"
              className="w-full"
              onClick={handleUploadClick}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  {t("backgrounds.uploading")}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("backgrounds.uploadCustom")}
                </>
              )}
            </Button> */}

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
};
