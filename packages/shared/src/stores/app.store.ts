import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

interface AppState {
  version: string;
  platform: "extension" | "web";
  mantraRotationCount: number;
  mantraRotationEnabled: boolean;
  setPlatform: (platform: "extension" | "web") => void;
  setVersion: (version: string) => void;
  incrementMantraRotationCount: () => void;
  setMantraRotation: (enabled: boolean) => void;
  initializeApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      version: "0.1.2",
      platform: "extension",
      mantraRotationCount: 0,
      mantraRotationEnabled: true,
      setPlatform: (platform) => set({ platform }),
      setVersion: (version) => set({ version }),
      incrementMantraRotationCount: () =>
        set((state) => ({
          mantraRotationCount: state.mantraRotationCount + 1,
        })),
      setMantraRotation: (enabled) => set({ mantraRotationEnabled: enabled }),
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
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state && state.mantraRotationEnabled) {
          state.incrementMantraRotationCount();
        }
        if (state) {
          state.initializeApp();
        }
      },
    }
  )
);
