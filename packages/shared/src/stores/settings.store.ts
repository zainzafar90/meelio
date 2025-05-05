import { create } from "zustand";

import { createJSONStorage, persist } from "zustand/middleware";

export type SettingsTab =
  | "general"
  | "appearance"
  | "account"
  | "billing"
  | "language"
  | "dock"
  | "feedback";

interface SettingsState {
  isOpen: boolean;
  currentTab: SettingsTab;
  openSettings: () => void;
  closeSettings: () => void;
  setTab: (tab: SettingsTab) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isOpen: false,
      currentTab: "general",
      openSettings: () => set({ isOpen: true }),
      closeSettings: () => set({ isOpen: false }),
      setTab: (tab) => set({ currentTab: tab }),
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
    }),
    {
      name: "meelio:local:settings",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTab: state.currentTab,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
