import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getBackgrounds } from "../api/backgrounds.api";

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
  addWallpaper: (wallpaper: Wallpaper) => void;
  removeWallpaper: (id: string) => void;
  setCurrentWallpaper: (wallpaper: Wallpaper) => void;
  resetToDefault: () => void;
  initializeWallpapers: () => void;
  isLoading: boolean;
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      wallpapers: [],
      currentWallpaper: null,
      isLoading: false,

      addWallpaper: (wallpaper) =>
        set((state) => ({
          wallpapers: [...state.wallpapers, wallpaper],
        })),

      removeWallpaper: (id) =>
        set((state) => ({
          wallpapers: state.wallpapers.filter((bg) => bg.id !== id),
        })),

      setCurrentWallpaper: (wallpaper) =>
        set({
          currentWallpaper: wallpaper,
        }),

      resetToDefault: () =>
        set({
          currentWallpaper: null,
        }),

      initializeWallpapers: async () => {
        set({ isLoading: true });

        try {
          const response = await getBackgrounds();
          console.log("response", response);

          if (
            response.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            // Convert API backgrounds to Wallpaper format
            const apiWallpapers = response.data.map((bg) => {
              const metadata = bg.metadata as ExtendedMetadata;
              const source = (
                bg.isDefault ? "api-default" : "api-custom"
              ) as WallpaperSource;

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

            // Replace defaults with API data
            set({
              wallpapers: apiWallpapers,
              currentWallpaper:
                apiWallpapers.find(
                  (bg) => bg.id === get().currentWallpaper?.id
                ) ||
                apiWallpapers.find(
                  (bg) => "isSelected" in bg && bg.isSelected
                ) ||
                apiWallpapers[0],
            });
          }
        } catch (error) {
          console.error("Failed to fetch backgrounds from API:", error);
          // Keep using defaults if API fails
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "background-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => {
            state.initializeWallpapers();
          }, 0);
        }
      },
    }
  )
);
