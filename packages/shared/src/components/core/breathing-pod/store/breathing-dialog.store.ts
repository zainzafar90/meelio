import { createWithEqualityFn as create } from "zustand/traditional";

interface BreathingDialogState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useBreathingDialogStore = create<BreathingDialogState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
