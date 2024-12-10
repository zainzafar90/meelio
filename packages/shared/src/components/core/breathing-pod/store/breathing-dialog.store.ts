import { create } from "zustand";

interface BreathingDialogState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useBreathingDialogStore = create<BreathingDialogState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
