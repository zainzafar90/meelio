import { ReactNode, useEffect, useState } from "react";

import { useAuthStore } from "../stores/auth.store";
import { AuthContext } from "../context/auth-context";
import { useShallow } from "zustand/shallow";
import { generateUUID } from "../utils/common.utils";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  const authStore = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
      authenticate: state.authenticate,
      authenticateGuest: state.authenticateGuest,
      updateUser: state.updateUser,
      loading: state.loading,
      logout: state.logout,
    }))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!authStore.user && !authStore.guestUser) {
        authStore.authenticateGuest({
          id: generateUUID(),
          role: "guest",
        });
      }
    }
  }, [mounted]);

  return (
    <AuthContext.Provider value={authStore}>
      {children}
    </AuthContext.Provider>
  );
};
