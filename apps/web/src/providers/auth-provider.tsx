import { ReactNode, useEffect } from "react";

import { api } from "@/api";
import { AuthContext } from "@/context/auth-context";

import { useAuthStore } from "@/stores/auth.store";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authStore = useAuthStore();

  const { authenticate } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        const response = await api.auth.getAuthenticatedAccount();
        const user = response;
        authenticate(user.data);
      } catch (error) {
        authenticate(null as any);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={authStore}>{children}</AuthContext.Provider>
  );
};
