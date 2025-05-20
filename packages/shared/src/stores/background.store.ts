import { create } from "zustand";

import { createJSONStorage, persist } from "zustand/middleware";
import { getAssetPath } from "../utils/path.utils";
import wallpapersData from "../data/wallpapers.json";

export type WallpaperType = "static" | "live";
export type WallpaperSource = "unsplash" | "custom" | "local";

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
  url: string;
  video: {
    fallbackImage: string;
  };
}

export type Wallpaper = StaticWallpaper | LiveWallpaper;

interface BackgroundState {
  wallpapers: Wallpaper[];
  currentWallpaper: Wallpaper | null;
  removeWallpaper: (id: string) => void;
  setCurrentWallpaper: (wallpaper: Wallpaper) => void;
  resetToDefault: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  getWallpaper: () => Wallpaper;
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
          url: getAssetPath(wallpaper.url || ""),
          video: {
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
        thumbnail: getAssetPath(wallpaper.thumbnail),
        url: getAssetPath(wallpaper.url || ""),
        video: {
          fallbackImage: getAssetPath(wallpaper.video.fallbackImage),
        },
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

// Read wallpaper directly from localStorage before Zustand hydration
const STORAGE_KEY = "meelio:local:background";
let INITIAL_WALLPAPER = CURRENT_DEFAULT_WALLPAPER;

try {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    if (parsedData.state?.currentWallpaper) {
      INITIAL_WALLPAPER = parsedData.state.currentWallpaper;
    }
  }
} catch (error) {
  console.error("Failed to read wallpaper from localStorage:", error);
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      wallpapers: DEFAULT_WALLPAPERS,
      currentWallpaper: INITIAL_WALLPAPER,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },

      getWallpaper: () => {
        return get()._hasHydrated
          ? get().currentWallpaper || CURRENT_DEFAULT_WALLPAPER
          : INITIAL_WALLPAPER;
      },

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
    }),
    {
      name: "meelio:local:background",
      storage: createJSONStorage(() => localStorage),
      version: 5,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

console.log(useBackgroundStore.persist.getOptions().version);
