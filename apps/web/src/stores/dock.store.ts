import { create } from "zustand";

interface DockStore {
  isTimerVisible: boolean;
  toggleTimer: () => void;
}

export const useDockStore = create<DockStore>((set) => ({
  isTimerVisible: false,
  toggleTimer: () =>
    set((state) => ({ isTimerVisible: !state.isTimerVisible })),
}));
