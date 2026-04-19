import { create } from "zustand";

type AuthActions = {
  signIn: () => void | Promise<void>;
  signOut: () => void | Promise<void>;
};

type AuthActionsState = {
  isSignedIn: boolean | null;
  actions: AuthActions | null;
  setActions: (actions: AuthActions) => void;
  setIsSignedIn: (signedIn: boolean) => void;
};

export const useAuthActionsStore = create<AuthActionsState>((set) => ({
  isSignedIn: null,
  actions: null,
  setActions: (actions) => set({ actions }),
  setIsSignedIn: (signedIn) => set({ isSignedIn: signedIn }),
}));
