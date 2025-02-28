import { create } from "zustand";

import { AuthUser } from "../types";
import { GuestUser } from "../types";
import { createJSONStorage, persist } from "zustand/middleware";

export type AuthState = {
  user: AuthUser | null;
  guestUser: GuestUser | null;
  loading: boolean;
  authenticate: (user: AuthUser) => void;
  authenticateGuest: (user: GuestUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      guestUser: null,
      loading: true,
      authenticate: (user: AuthUser) =>
        set((state) => ({ ...state, user, loading: false })),
      authenticateGuest: (user: GuestUser) =>
        set((state) => ({
          ...state,
          guestUser: user,
          loading: false,
        })),
      logout: () => set(() => ({ user: null, guestUser: null })),
    }),
    {
      name: "meelio:local:user",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
