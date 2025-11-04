import { create } from "zustand";

import { createJSONStorage, persist } from "zustand/middleware";

export type SettingsTab =
  | "general"
  | "appearance"
  | "account"
  | "billing"
  | "language"
  | "dock"
  | "feedback"
  | "timer";

interface SettingsState {
  isOpen: boolean;
  currentTab: SettingsTab;
  openSettings: () => void;
  closeSettings: () => void;
  setTab: (tab: SettingsTab) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isOpen: false,
      currentTab: "general",
      openSettings: () => set({ isOpen: true }),
      closeSettings: () => set({ isOpen: false }),
      setTab: (tab) => set({ currentTab: tab }),
    }),
    {
      name: "meelio:local:settings",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTab: state.currentTab,
      }),
    }
  )
);
