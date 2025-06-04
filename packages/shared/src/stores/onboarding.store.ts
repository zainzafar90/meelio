import { create } from "zustand";

import { createJSONStorage, persist } from "zustand/middleware";
import { api } from "../api";
import { useAuthStore } from "./auth.store";

interface OnboardingState {
  hasDockOnboardingCompleted: boolean;
  setDockOnboardingCompleted: () => void;
  setDockOnboardingCompletedWithSync: () => Promise<void>;
  resetOnboarding: () => void;
  resetOnboardingWithSync: () => Promise<void>;
  triggerOnboardingUpdate: (completed: boolean) => Promise<void>;
  syncWithUserSettings: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasDockOnboardingCompleted: false,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
      setDockOnboardingCompleted: () =>
        set({ hasDockOnboardingCompleted: true }),
      setDockOnboardingCompletedWithSync: async () => {
        // Update local state first
        set({ hasDockOnboardingCompleted: true });

        // Sync with server if user is authenticated
        const authState = useAuthStore.getState();
        if (authState.user) {
          try {
            await api.settings.settingsApi.updateSettings({
              onboardingCompleted: true,
            });

            // Update the user in auth store to reflect the change
            const updatedUser = {
              ...authState.user,
              settings: {
                ...authState.user.settings,
                onboardingCompleted: true,
              },
            };
            authState.authenticate(updatedUser);
          } catch (error) {
            console.error(
              "Failed to sync onboarding completion with server:",
              error
            );
            // Don't revert local state - user experience should not be affected
          }
        }
      },
      resetOnboarding: () => set({ hasDockOnboardingCompleted: false }),
      resetOnboardingWithSync: async () => {
        // Update local state first
        set({ hasDockOnboardingCompleted: false });

        // Sync with server if user is authenticated
        const authState = useAuthStore.getState();
        if (authState.user) {
          try {
            await api.settings.settingsApi.updateSettings({
              onboardingCompleted: false,
            });

            // Update the user in auth store to reflect the change
            const updatedUser = {
              ...authState.user,
              settings: {
                ...authState.user.settings,
                onboardingCompleted: false,
              },
            };
            authState.authenticate(updatedUser);
          } catch (error) {
            console.error(
              "Failed to sync onboarding reset with server:",
              error
            );
            // Don't revert local state - user experience should not be affected
          }
        }
      },
      triggerOnboardingUpdate: async (completed: boolean) => {
        if (completed) {
          await get().setDockOnboardingCompletedWithSync();
        } else {
          await get().resetOnboardingWithSync();
        }
      },
      syncWithUserSettings: () => {
        const authState = useAuthStore.getState();
        const user = authState.user;

        if (user?.settings?.onboardingCompleted) {
          set({ hasDockOnboardingCompleted: true });
        }
      },
    }),
    {
      name: "meelio:local:onboarding",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

useAuthStore.subscribe((state) => {
  if (state.user?.settings?.onboardingCompleted) {
    useOnboardingStore.getState().syncWithUserSettings();
  }
});
