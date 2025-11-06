import { create } from "zustand";

interface AppLauncherState {
  isVisible: boolean;
  searchQuery: string;

  open: () => void;
  close: () => void;
  toggle: () => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

export const useAppLauncherStore = create<AppLauncherState>((set) => ({
  isVisible: false,
  searchQuery: "",

  open: () => set({ isVisible: true }),
  close: () => set({ isVisible: false, searchQuery: "" }),
  toggle: () => set((state) => ({
    isVisible: !state.isVisible,
    searchQuery: !state.isVisible ? "" : state.searchQuery
  })),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  clearSearch: () => set({ searchQuery: "" }),
}));
