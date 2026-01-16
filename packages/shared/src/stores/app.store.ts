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
  confettiOnComplete: boolean;
  setPlatform: (platform: "extension" | "web") => void;
  incrementMantraRotationCount: () => void;
  setMantraRotation: (enabled: boolean) => void;
  setWallpaperRotationEnabled: (enabled: boolean) => void;
  setTwelveHourClock: (enabled: boolean) => void;
  setConfettiOnComplete: (enabled: boolean) => void;
  initializeApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      version: "0.8.2",
      platform: "extension",
      mantraRotationCount: 0,
      mantraRotationEnabled: true,
      wallpaperRotationEnabled: true,
      twelveHourClock: true,
      confettiOnComplete: true,
      setPlatform: (platform) => set({ platform }),
      incrementMantraRotationCount: () =>
        set((state) => ({
          mantraRotationCount: state.mantraRotationCount + 1,
        })),
      setMantraRotation: (enabled) => set({ mantraRotationEnabled: enabled }),
      setWallpaperRotationEnabled: (enabled) =>
        set({ wallpaperRotationEnabled: enabled }),
      setTwelveHourClock: (enabled) => set({ twelveHourClock: enabled }),
      setConfettiOnComplete: (enabled) => set({ confettiOnComplete: enabled }),
      initializeApp: () => {
        const version = localStorage.getItem("meelio:local:version");
        if (version) {
          set({ version });
        }
      },
    }),
    {
      name: "meelio:local:app",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      skipHydration: false,
      partialize: (s) => ({
        platform: s.platform,
        mantraRotationCount: s.mantraRotationCount,
        mantraRotationEnabled: s.mantraRotationEnabled,
        wallpaperRotationEnabled: s.wallpaperRotationEnabled,
        twelveHourClock: s.twelveHourClock,
        confettiOnComplete: s.confettiOnComplete,
      }),
      migrate: (persistedState: any, _version: number) => {
        const state = { ...persistedState };
        if (state.confettiOnComplete === undefined) {
          state.confettiOnComplete = true;
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        if (state && state.mantraRotationEnabled) {
          state.incrementMantraRotationCount();
        }
        if (state) {
          state.initializeApp();
        }
      },
    },
  ),
);

export const isExtension = useAppStore.getState().platform === "extension";
