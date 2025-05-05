import { ReactNode, useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../stores/auth.store";
import { api } from "../api";
import { AuthContext } from "../context/auth-context";
import { useShallow } from "zustand/shallow";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  const authStore = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
      authenticate: state.authenticate,
      authenticateGuest: state.authenticateGuest,
      loading: state.loading,
      logout: state.logout,
      _hasHydrated: state._hasHydrated,
      setHasHydrated: state.setHasHydrated,
    }))
  );

  useEffect(() => {
    (async () => {
      const DELAY = authStore.user ? 3000 : 0;
      setTimeout(async () => {
        try {
          const response = await api.auth.getAuthenticatedAccount();
          const user = response;
          authStore.authenticate(user.data);
          authStore.authenticateGuest(null as any);
        } catch (error) {
          authStore.authenticate(null as any);
        }
      }, DELAY);
    })();
  }, []);

  return (
    <AuthContext.Provider value={authStore}>{children}</AuthContext.Provider>
  );
};
