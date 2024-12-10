import { api } from "@repo/shared";
import { AuthContext } from "@repo/shared";
import { useAuthStore } from "@repo/shared";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={authStore}>{children}</AuthContext.Provider>
  );
};
