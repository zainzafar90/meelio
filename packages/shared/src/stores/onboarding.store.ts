import { create } from "zustand";

import { createJSONStorage, persist } from "zustand/middleware";

interface OnboardingState {
  hasDockOnboardingCompleted: boolean;
  setDockOnboardingCompleted: () => void;
  resetOnboarding: () => void;
  triggerOnboardingUpdate: (completed: boolean) => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasDockOnboardingCompleted: false,
      setDockOnboardingCompleted: () =>
        set({ hasDockOnboardingCompleted: true }),
      resetOnboarding: () => set({ hasDockOnboardingCompleted: false }),
      triggerOnboardingUpdate: async (completed: boolean) => {
        if (completed) {
          get().setDockOnboardingCompleted();
        } else {
          get().resetOnboarding();
        }
      },
    }),
    {
      name: "meelio:local:onboarding",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      skipHydration: false,
    }
  )
);
