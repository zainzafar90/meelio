import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type WallpaperType = "static" | "live";

export interface BaseWallpaper {
  id: string;
  type: WallpaperType;
  title: string;
  author: string;
  thumbnail: string;
  blurhash: string;
  source: "unsplash" | "custom" | "local";
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

interface BackgroundState {
  wallpapers: Wallpaper[];
  currentWallpaper: Wallpaper | null;
  addWallpaper: (wallpaper: Wallpaper) => void;
  removeWallpaper: (id: string) => void;
  setCurrentWallpaper: (wallpaper: Wallpaper) => void;
  resetToDefault: () => void;
  initializeWallpapers: () => void;
}

const DEFAULT_WALLPAPERS: Wallpaper[] = [
  {
    id: "live-1",
    type: "live",
    title: "Spring Lofi",
    thumbnail: "/live-wallpapers/01-spring-lofi-thumbnail.png",
    blurhash: "LjI6AjogNtNG_4V@ocI;I@M_aKS#",
    author: "Local",
    source: "local",
    video: {
      src: "/live-wallpapers/01-spring-lofi.mp4",
      fallbackImage: "/live-wallpapers/01-spring-lofi.avif",
    },
  },
  {
    id: "live-2",
    type: "live",
    title: "Rainy Forest",
    thumbnail: "/live-wallpapers/02-rainy-forest-thumbnail.png",
    blurhash: "L33b,b:#q@Y8.A#Ov|%hMdS5tmwZ",
    author: "Local",
    source: "local",
    video: {
      src: "/live-wallpapers/02-rainy-forest.mp4",
      fallbackImage: "/live-wallpapers/02-rainy-forest.avif",
    },
  },

  {
    id: "static-1",
    type: "static",
    url: "https://images.unsplash.com/photo-1505699261378-c372af38134c",
    title: "Gray Bridge Golden Hour",

    thumbnail:
      "https://images.unsplash.com/photo-1505699261378-c372af38134c?w=160&fit=max",
    blurhash: "L}JFcXIpNbX8}?RlS4W;xYe:a#W;",
    author: "Unsplash",
    source: "unsplash",
  },
  {
    id: "static-2",
    type: "static",
    url: "https://images.unsplash.com/photo-1731432248688-b0b0d1743add",
    title: "Road In Trees",
    thumbnail:
      "https://images.unsplash.com/photo-1731432248688-b0b0d1743add?w=160&fit=max",
    blurhash: "L39tbzoz02~TQqV]?Zxt01nO~m9b",
    author: "Unsplash",
    source: "unsplash",
  },
  {
    id: "static-3",
    type: "static",
    url: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1",
    title: "Mountain Lake",
    thumbnail:
      "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=160&fit=max",
    blurhash: "LG87OVl:ICIoL#TKyZs;nNyYVXQ,",
    author: "Unsplash",
    source: "unsplash",
  },
  {
    id: "static-4",
    type: "static",
    url: "https://images.unsplash.com/photo-1543253539-58c7d1c00c8a",
    title: "Hills Aerial Snow Capped",
    thumbnail:
      "https://images.unsplash.com/photo-1543253539-58c7d1c00c8a?w=160&fit=max",
    blurhash: "LXF}]PENNas:~EI?bHax4.X6s+ju",
    author: "Unsplash",
    source: "unsplash",
  },
  {
    id: "static-5",
    type: "static",
    url: "https://images.unsplash.com/photo-1732465286852-a0b95393a90d",
    title: "Group of Mountains with Snow",
    thumbnail:
      "https://images.unsplash.com/photo-1732465286852-a0b95393a90d?w=160&fit=max",
    blurhash: "LgF5%3E2Nxax~VIpX8ayT0o0s:R*",
    author: "Unsplash",
    source: "unsplash",
  },
];

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      wallpapers: DEFAULT_WALLPAPERS,
      currentWallpaper: DEFAULT_WALLPAPERS[0],

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
          wallpapers: DEFAULT_WALLPAPERS,
          currentWallpaper: DEFAULT_WALLPAPERS[0],
        }),

      initializeWallpapers: () => {
        const state = get();
        // If wallpapers array is empty or doesn't match the default structure
        set({
          wallpapers: DEFAULT_WALLPAPERS,
        });

        if (!state.currentWallpaper || !state.wallpapers.length) {
          set({
            currentWallpaper: DEFAULT_WALLPAPERS[0],
          });
        }
      },
    }),
    {
      name: "background-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1, // Add version for potential migrations
      onRehydrateStorage: () => (state) => {
        // When storage is rehydrated, ensure we have the default wallpapers
        if (state) {
          state.initializeWallpapers();
        }
      },
    }
  )
);
