import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getAssetPath } from "../utils/path.utils";
import { getSeedIndexByDate } from "../utils/common.utils";

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
  wallpaperRotationEnabled: boolean;
  setWallpaperRotationEnabled: (enabled: boolean) => void;
  getWallpaper: () => Wallpaper;
}

const DEFAULT_WALLPAPERS: Wallpaper[] = (wallpapersData as Wallpaper[]).map(
  (wallpaper) => {
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
  }
);

const STORAGE_KEY = "meelio:local:background";

const CURRENT_DEFAULT_WALLPAPER = DEFAULT_WALLPAPERS[3];

let INITIAL_WALLPAPER = CURRENT_DEFAULT_WALLPAPER;

const loadInitialWallpaper = () => {
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
};

loadInitialWallpaper();

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      wallpapers: DEFAULT_WALLPAPERS,
      currentWallpaper: INITIAL_WALLPAPER,
      _hasHydrated: false,
      wallpaperRotationEnabled: true,
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
        if (state && get().wallpaperRotationEnabled) {
          const index = getSeedIndexByDate(DEFAULT_WALLPAPERS.length);
          set({ currentWallpaper: DEFAULT_WALLPAPERS[index] });
        }
      },
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
      setWallpaperRotationEnabled: (enabled) => {
        set({ wallpaperRotationEnabled: enabled });
        if (enabled) {
          const index = getSeedIndexByDate(DEFAULT_WALLPAPERS.length);
          set({ currentWallpaper: DEFAULT_WALLPAPERS[index] });
        }
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
      version: 6,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
