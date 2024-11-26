import { ReactNode, useEffect } from "react";

import { api } from "@/api";
import { AuthContext } from "@/context/auth-context";

import { AuthUser } from "@/types/auth";
import { useAuthStore } from "@/stores/auth.store";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authStore = useAuthStore();

  const { authenticate } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        const response = await api.auth.getAuthenticatedAccount();
        const user = response as AuthUser;
        authenticate(user);
      } catch (error) {
        console.error(error);
        authenticate({} as AuthUser);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={authStore}>{children}</AuthContext.Provider>
  );
};
