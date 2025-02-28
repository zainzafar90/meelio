import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

interface AppState {
  version: string;
  setVersion: (version: string) => void;
  initializeApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      version: "0.1.0",
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
