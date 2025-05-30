import { create } from "zustand";

import { AuthUser } from "../types";
import { GuestUser } from "../types";
import { createJSONStorage, persist } from "zustand/middleware";
// import { useBackgroundStore } from "./background.store";

export type AuthState = {
  user: AuthUser | null;
  guestUser: GuestUser | null;
  loading: boolean;
  authenticate: (user: AuthUser) => void;
  authenticateGuest: (user: GuestUser) => void;
  logout: () => void;
  logoutUser: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      guestUser: null,
      loading: true,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
      authenticate: (user: AuthUser) =>
        set((state) => ({ ...state, user, loading: false })),
      authenticateGuest: (user: GuestUser) =>
        set((state) => ({
          ...state,
          guestUser: user,
          loading: false,
        })),
      logout: () => set(() => ({ user: null, guestUser: null })),
      logoutUser: () => set(() => ({ user: null })),
    }),
    {
      name: "meelio:local:user",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// useAuthStore.subscribe((state) => {
//   if (!state.user && !state.guestUser) {
//     useBackgroundStore.getState().resetToDefault();
//   }
// });
