import { ReactNode } from "react";

import { AuthContext } from "@/context/auth-context";

import { useAuthStore } from "@/store/auth.store";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authStore = useAuthStore();

  return (
    <AuthContext.Provider value={authStore}>{children}</AuthContext.Provider>
  );
};
