import { create } from "zustand";

import { persist } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

interface AppState {
  version: string;
  platform: "extension" | "web";
  mantraRotationCount: number;
  mantraRotationEnabled: boolean;
  wallpaperRotationEnabled: boolean;
  twelveHourClock: boolean;
  setPlatform: (platform: "extension" | "web") => void;
  setVersion: (version: string) => void;
  incrementMantraRotationCount: () => void;
  setMantraRotation: (enabled: boolean) => void;
  setWallpaperRotationEnabled: (enabled: boolean) => void;
  setTwelveHourClock: (enabled: boolean) => void;
  initializeApp: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      version: "0.6.0",
      platform: "extension",
      mantraRotationCount: 0,
      mantraRotationEnabled: true,
      wallpaperRotationEnabled: true,
      twelveHourClock: true,
      setPlatform: (platform) => set({ platform }),
      setVersion: (version) => set({ version }),
      incrementMantraRotationCount: () =>
        set((state) => ({
          mantraRotationCount: state.mantraRotationCount + 1,
        })),
      setMantraRotation: (enabled) => set({ mantraRotationEnabled: enabled }),
      setWallpaperRotationEnabled: (enabled) =>
        set({ wallpaperRotationEnabled: enabled }),
      setTwelveHourClock: (enabled) => set({ twelveHourClock: enabled }),
      initializeApp: () => {
        const version = localStorage.getItem("meelio:local:version");
        if (version) {
          set({ version });
        }
      },
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
    }),
    {
      name: "meelio:local:app",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      skipHydration: false,
      partialize: (s) => ({
        platform: s.platform,
        mantraRotationCount: s.mantraRotationCount,
        mantraRotationEnabled: s.mantraRotationEnabled,
        wallpaperRotationEnabled: s.wallpaperRotationEnabled,
        twelveHourClock: s.twelveHourClock,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.mantraRotationEnabled) {
          state.incrementMantraRotationCount();
        }
        if (state) {
          state.initializeApp();
        }
        state?.setHasHydrated(true);
      },
    }
  )
);

export const isExtension = useAppStore.getState().platform === "extension";
