import { create } from "zustand";

import { AuthUser } from "../types";

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  authenticate: (user: AuthUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  authenticate: (user: AuthUser) =>
    set((state) => ({ ...state, user, loading: false })),
  logout: () => set(() => ({ user: null })),
}));
