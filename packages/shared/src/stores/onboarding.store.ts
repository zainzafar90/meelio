import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  hasDockOnboardingCompleted: boolean;
  setDockOnboardingCompleted: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasDockOnboardingCompleted: false,
      setDockOnboardingCompleted: () =>
        set({ hasDockOnboardingCompleted: true }),
      resetOnboarding: () => set({ hasDockOnboardingCompleted: false }),
    }),
    {
      name: "meelio:local:onboarding",
    }
  )
);
