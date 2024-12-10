import { useAuthStore } from "../stores";
import { api } from "../api";
import { AuthContext } from "../context/auth-context";
import { ReactNode, useEffect } from "react";

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
  }, []);

  return (
    <AuthContext.Provider value={authStore}>{children}</AuthContext.Provider>
  );
};
