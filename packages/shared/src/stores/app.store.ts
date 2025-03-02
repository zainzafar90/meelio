import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

interface AppState {
  version: string;
  platform: "extension" | "web";
  setPlatform: (platform: "extension" | "web") => void;
  setVersion: (version: string) => void;
  initializeApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      version: "0.1.0",
      platform: "extension",
      setPlatform: (platform) => set({ platform }),
      setVersion: (version) => set({ version }),
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
        if (state) {
          state.initializeApp();
        }
      },
    }
  )
);
