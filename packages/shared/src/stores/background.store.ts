import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getAssetPath } from "../utils/path.utils";
import wallpapersData from "../data/wallpapers.json";
import { useAppStore } from "./app.store";
import { getSeedIndexByDate } from "../utils";

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

export const DEFAULT_WALLPAPERS: Wallpaper[] = (
  wallpapersData as Wallpaper[]
).map((wallpaper) => {
  const baseWallpaper = {
    ...wallpaper,
    thumbnail: getAssetPath(wallpaper.thumbnail),
  };

  if (wallpaper.type === "live" && wallpaper.video) {
    return {
      ...baseWallpaper,
      url: getAssetPath(wallpaper.url || ""),
      video: {
        fallbackImage: getAssetPath(wallpaper.video.fallbackImage),
      },
    } as LiveWallpaper;
  }

  return baseWallpaper as StaticWallpaper;
});

const CURRENT_DEFAULT_WALLPAPER = DEFAULT_WALLPAPERS[3];
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
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      getWallpaper: () =>
        get()._hasHydrated
          ? get().currentWallpaper || CURRENT_DEFAULT_WALLPAPER
          : INITIAL_WALLPAPER,
      removeWallpaper: (id) =>
        set((state) => ({
          wallpapers: state.wallpapers.filter((bg) => bg.id !== id),
        })),
      setCurrentWallpaper: (wallpaper) => {
        if (!wallpaper) {
          set({ currentWallpaper: CURRENT_DEFAULT_WALLPAPER });
          return;
        }

        set((state) => ({
          currentWallpaper: wallpaper,
          wallpapers: state.wallpapers.map((wp) => ({
            ...wp,
            isFavourite: wp.id === wallpaper.id,
          })),
        }));
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
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 8,
      partialize: (state) => ({
        currentWallpaper: state.currentWallpaper,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (useAppStore.getState().wallpaperRotationEnabled) {
          state.setCurrentWallpaper(state.wallpapers[getSeedIndexByDate(91)]);
        }
      },
    }
  )
);

console.log(useBackgroundStore.persist.getOptions().version);
