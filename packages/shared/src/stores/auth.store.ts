import { create } from "zustand";

import { LocalUser, GuestUser } from "../types";
import { createJSONStorage, persist } from "zustand/middleware";
import { useCategoryStore } from "./category.store";

export type AuthState = {
  user: LocalUser | null;
  guestUser: GuestUser | null;
  loading: boolean;
  authenticate: (user: LocalUser) => void;
  authenticateGuest: (user: GuestUser) => void;
  updateUser: (updates: Partial<LocalUser>) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      guestUser: null,
      loading: true,
      authenticate: (user: LocalUser) =>
        set((state) => ({ ...state, user, loading: false })),
      authenticateGuest: (user: GuestUser) =>
        set((state) => ({
          ...state,
          guestUser: user,
          loading: false,
        })),
      updateUser: (updates: Partial<LocalUser>) =>
        set((state) => ({
          ...state,
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => {
        useCategoryStore.getState().reset();
        set(() => ({ user: null, guestUser: null }));
      },
    }),
    {
      name: "meelio:local:user",
      storage: createJSONStorage(() => localStorage),
      version: 4,
      skipHydration: false,
      migrate: (persistedState: any, _version: number) => {
        const state = { ...persistedState };
        if (state.user) {
          state.user = {
            id: state.user.id,
            name: state.user.name || "User",
            avatarUrl: state.user.image || state.user.avatarUrl,
            createdAt: state.user.createdAt || Date.now(),
            settings: state.user.settings,
          };
        }
        delete state.lastSuccessfulAuth;
        return state;
      },
    }
  )
);
