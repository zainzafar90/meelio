import { ReactNode } from "react";

import { AuthContext } from "@/context/auth-context";
import { useAuthStore } from "@/stores/auth.store";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authStore = useAuthStore();

  return (
    <AuthContext.Provider value={authStore}>{children}</AuthContext.Provider>
  );
};
