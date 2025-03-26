import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getBackgrounds } from "../api/backgrounds.api";
import { getAssetPath } from "../utils/path.utils";
import { useAuthStore } from "./auth.store";
import wallpapersData from "../data/wallpapers.json";

export type WallpaperType = "static" | "live";
export type WallpaperSource =
  | "unsplash"
  | "custom"
  | "local"
  | "api-default"
  | "api-custom";

export interface BaseWallpaper {
  id: string;
  type: WallpaperType;
  title: string;
  author: string;
  thumbnail: string;
  blurhash: string;
  source: WallpaperSource;
}

export interface StaticWallpaper extends BaseWallpaper {
  type: "static";
  url: string;
}

export interface LiveWallpaper extends BaseWallpaper {
  type: "live";
  video: {
    src: string;
    fallbackImage: string;
  };
}

export type Wallpaper = StaticWallpaper | LiveWallpaper;

// Extended metadata type to handle API response
interface ExtendedMetadata {
  name?: string;
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  blurhash?: string;
  fallbackImage?: string;
}

interface BackgroundState {
  wallpapers: Wallpaper[];
  currentWallpaper: Wallpaper | null;
  removeWallpaper: (id: string) => void;
  setCurrentWallpaper: (wallpaper: Wallpaper) => void;
  resetToDefault: () => void;
  initializeWallpapers: () => void;
  isLoading: boolean;
}

type WallpaperData = {
  id: string;
  type: "static" | "live";
  title: string;
  author: string;
  thumbnail: string;
  blurhash: string;
  source: WallpaperSource;
  url?: string;
  video?: {
    src: string;
    fallbackImage: string;
  };
};

const DEFAULT_WALLPAPERS: Wallpaper[] = (wallpapersData as WallpaperData[]).map(
  (wallpaper) => {
    if (wallpaper.source === "local") {
      if (wallpaper.type === "live" && wallpaper.video) {
        return {
          ...wallpaper,
          type: "live" as const,
          thumbnail: getAssetPath(wallpaper.thumbnail),
          video: {
            src: getAssetPath(wallpaper.video.src),
            fallbackImage: getAssetPath(wallpaper.video.fallbackImage),
          },
        } as LiveWallpaper;
      } else if (wallpaper.type === "static") {
        return {
          ...wallpaper,
          type: "static" as const,
          thumbnail: getAssetPath(wallpaper.thumbnail),
        } as StaticWallpaper;
      }
    }

    // For non-local wallpapers
    if (wallpaper.type === "live" && wallpaper.video) {
      return {
        ...wallpaper,
        type: "live" as const,
      } as LiveWallpaper;
    } else {
      return {
        ...wallpaper,
        type: "static" as const,
      } as StaticWallpaper;
    }
  }
);

const CURRENT_DEFAULT_WALLPAPER = DEFAULT_WALLPAPERS[3];

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      wallpapers: DEFAULT_WALLPAPERS,
      currentWallpaper: CURRENT_DEFAULT_WALLPAPER,
      isLoading: false,

      removeWallpaper: (id) =>
        set((state) => ({
          wallpapers: state.wallpapers.filter((bg) => bg.id !== id),
        })),

      setCurrentWallpaper: (wallpaper) => {
        if (!wallpaper) {
          set({ currentWallpaper: CURRENT_DEFAULT_WALLPAPER });
          return;
        }

        set((state) => {
          const updatedWallpapers = state.wallpapers.map((wp) => ({
            ...wp,
            isFavourite: wp.id === wallpaper.id,
          }));

          return {
            currentWallpaper: wallpaper,
            wallpapers: updatedWallpapers,
          };
        });
      },

      resetToDefault: () =>
        set({
          currentWallpaper: CURRENT_DEFAULT_WALLPAPER,
          wallpapers: DEFAULT_WALLPAPERS.map((wp) => ({
            ...wp,
            isFavourite: wp.id === CURRENT_DEFAULT_WALLPAPER.id,
          })),
        }),

      initializeWallpapers: async () => {
        set({ isLoading: true });
        try {
          const response = await getBackgrounds();
          if (
            response.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            // Convert API backgrounds to Wallpaper format
            const apiWallpapers = response.data.map((bg) => {
              const metadata = bg.metadata as ExtendedMetadata;
              const source = "api-custom" as WallpaperSource;

              if (bg.type === "live") {
                return {
                  id: bg.id,
                  type: "live" as const,
                  title: metadata?.name || "Live Background",
                  author: metadata?.category || "Unknown",
                  thumbnail: metadata?.thumbnailUrl || "",
                  blurhash: metadata?.blurhash || "",
                  source,
                  video: {
                    src: bg.url || "",
                    fallbackImage:
                      metadata?.fallbackImage || metadata?.thumbnailUrl || "",
                  },
                } as LiveWallpaper;
              } else {
                return {
                  id: bg.id,
                  type: "static" as const,
                  title: metadata?.name || "Static Background",
                  author: metadata?.category || "Unknown",
                  thumbnail: metadata?.thumbnailUrl || bg.url || "",
                  blurhash: metadata?.blurhash || "",
                  source,
                  url: bg.url || "",
                } as StaticWallpaper;
              }
            });

            set({
              wallpapers: apiWallpapers,
              currentWallpaper:
                apiWallpapers.find(
                  (bg) => bg.id === get().currentWallpaper?.id
                ) ||
                apiWallpapers.find(
                  (bg) => "isFavourite" in bg && bg.isFavourite
                ) ||
                apiWallpapers[0],
            });
          }
        } catch (error) {
          console.error("Failed to fetch backgrounds from API:", error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "meelio:local:background",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeWallpapers();
        }
      },
    }
  )
);
