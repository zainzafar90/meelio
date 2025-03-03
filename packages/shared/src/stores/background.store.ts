import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getBackgrounds } from "../api/backgrounds.api";
import { getAssetPath } from "../utils/path.utils";
import { useAuthStore } from "./auth.store";

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

const DEFAULT_WALLPAPERS: Wallpaper[] = [
  {
    id: "live-1",
    type: "live",
    title: "Spring Lofi",
    thumbnail: getAssetPath(
      "/public/live-wallpapers/01-spring-lofi-thumbnail.png"
    ),
    blurhash: "LjI6AjogNtNG_4V@ocI;I@M_aKS#",
    author: "Local",
    source: "local",
    video: {
      src: getAssetPath("/public/live-wallpapers/01-spring-lofi.mp4"),
      fallbackImage: getAssetPath(
        "/public/live-wallpapers/01-spring-lofi.avif"
      ),
    },
  },
  {
    id: "live-2",
    type: "live",
    title: "Rainy Forest",
    thumbnail: getAssetPath(
      "/public/live-wallpapers/02-rainy-forest-thumbnail.png"
    ),
    blurhash: "L33b,b:#q@Y8.A#Ov|%hMdS5tmwZ",
    author: "Local",
    source: "local",
    video: {
      src: getAssetPath("/public/live-wallpapers/02-rainy-forest.mp4"),
      fallbackImage: getAssetPath(
        "/public/live-wallpapers/02-rainy-forest.avif"
      ),
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
            isSelected: wp.id === wallpaper.id,
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
            isSelected: wp.id === CURRENT_DEFAULT_WALLPAPER.id,
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
          setTimeout(() => {
            state.initializeWallpapers();
          }, 0);
        }
      },
    }
  )
);
