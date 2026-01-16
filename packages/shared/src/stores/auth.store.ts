import { create } from "zustand";

import { User } from "../types";
import { createJSONStorage, persist } from "zustand/middleware";
import { useCategoryStore } from "./category.store";

export const getAuthUserId = (): string | undefined => {
  return useAuthStore.getState().user?.id;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  authenticate: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      authenticate: (user: User) =>
        set((state) => ({ ...state, user, loading: false })),
      updateUser: (updates: Partial<User>) =>
        set((state) => ({
          ...state,
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => {
        useCategoryStore.getState().reset();
        set(() => ({ user: null }));
      },
    }),
    {
      name: "meelio:local:user",
      storage: createJSONStorage(() => localStorage),
      version: 5,
      skipHydration: false,
      migrate: (persistedState: any, _version: number) => {
        const state = { ...persistedState };
        const oldUser = state.user || state.guestUser;
        if (oldUser) {
          state.user = {
            id: oldUser.id,
            name: oldUser.name || "",
            avatarUrl: oldUser.image || oldUser.avatarUrl,
            createdAt: typeof oldUser.createdAt === 'string'
              ? new Date(oldUser.createdAt).getTime()
              : (oldUser.createdAt || Date.now()),
            settings: oldUser.settings,
          };
        }
        delete state.guestUser;
        delete state.lastSuccessfulAuth;
        return state;
      },
    }
  )
);
