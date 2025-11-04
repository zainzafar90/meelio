import { create } from "zustand";

import { AuthUser } from "../types";
import { GuestUser } from "../types";
import { createJSONStorage, persist } from "zustand/middleware";
// import { useBackgroundStore } from "./background.store";
import { useCategoryStore } from "./category.store";

export type AuthState = {
  user: AuthUser | null;
  guestUser: GuestUser | null;
  loading: boolean;
  lastSuccessfulAuth: number | null;
  authenticate: (user: AuthUser) => void;
  authenticateGuest: (user: GuestUser) => void;
  logout: () => void;
  logoutUser: () => void;
  updateLastSuccessfulAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      guestUser: null,
      loading: true,
      lastSuccessfulAuth: null,
      authenticate: (user: AuthUser) =>
        set((state) => ({ ...state, user, loading: false })),
      authenticateGuest: (user: GuestUser) =>
        set((state) => ({
          ...state,
          guestUser: user,
          loading: false,
        })),
      logout: () => {
        useCategoryStore.getState().reset();
        set(() => ({ user: null, guestUser: null, lastSuccessfulAuth: null }));
      },
      logoutUser: () => {
        useCategoryStore.getState().reset();
        set(() => ({ user: null, lastSuccessfulAuth: null }));
      },
      updateLastSuccessfulAuth: () => {
        set({ lastSuccessfulAuth: Date.now() });
      },
    }),
    {
      name: "meelio:local:user",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      skipHydration: false,
    }
  )
);