import { create } from "zustand";

export type SettingsTab =
  | "general"
  | "appearance"
  | "account"
  | "billing"
  | "language"
  | "dock";

interface SettingsState {
  isOpen: boolean;
  currentTab: SettingsTab;
  openSettings: () => void;
  closeSettings: () => void;
  setTab: (tab: SettingsTab) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isOpen: false,
  currentTab: "general",
  openSettings: () => set({ isOpen: true }),
  closeSettings: () => set({ isOpen: false }),
  setTab: (tab) => set({ currentTab: tab }),
}));
