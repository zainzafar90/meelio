import { create } from "zustand";

import { persist } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

export interface ZenModeSettings {
  timerEnabled: boolean;
  soundscapesEnabled: boolean;
  pinnedTaskSyncEnabled: boolean;
  siteBlockerEnabled: boolean;
  tabStashEnabled: boolean;
}

const defaultZenModeSettings = (): ZenModeSettings => ({
  timerEnabled: true,
  soundscapesEnabled: true,
  pinnedTaskSyncEnabled: true,
  siteBlockerEnabled: true,
  tabStashEnabled: false,
});

interface AppState {
  version: string;
  platform: "extension" | "web";
  mantraRotationCount: number;
  mantraRotationEnabled: boolean;
  wallpaperRotationEnabled: boolean;
  twelveHourClock: boolean;
  confettiOnComplete: boolean;
  zenMode: ZenModeSettings;
  setPlatform: (platform: "extension" | "web") => void;
  incrementMantraRotationCount: () => void;
  setMantraRotation: (enabled: boolean) => void;
  setWallpaperRotationEnabled: (enabled: boolean) => void;
  setTwelveHourClock: (enabled: boolean) => void;
  setConfettiOnComplete: (enabled: boolean) => void;
  updateZenModeSettings: (updates: Partial<ZenModeSettings>) => void;
  initializeApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      version: "0.9.4",
      platform: "extension",
      mantraRotationCount: 0,
      mantraRotationEnabled: true,
      wallpaperRotationEnabled: true,
      twelveHourClock: true,
      confettiOnComplete: true,
      zenMode: defaultZenModeSettings(),
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
      updateZenModeSettings: (updates) =>
        set((state) => ({
          zenMode: {
            ...state.zenMode,
            ...updates,
          },
        })),
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
      version: 4,
      skipHydration: false,
      partialize: (s) => ({
        platform: s.platform,
        mantraRotationCount: s.mantraRotationCount,
        mantraRotationEnabled: s.mantraRotationEnabled,
        wallpaperRotationEnabled: s.wallpaperRotationEnabled,
        twelveHourClock: s.twelveHourClock,
        confettiOnComplete: s.confettiOnComplete,
        zenMode: s.zenMode,
      }),
      migrate: (persistedState: any, _version: number) => {
        const state = { ...persistedState };
        if (state.confettiOnComplete === undefined) {
          state.confettiOnComplete = true;
        }
        state.zenMode = {
          ...defaultZenModeSettings(),
          ...(state.zenMode ?? {}),
        };
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
