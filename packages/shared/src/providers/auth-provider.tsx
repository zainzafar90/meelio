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
      authenticate: state.authenticate,
      updateUser: state.updateUser,
      loading: state.loading,
      logout: state.logout,
    }))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authStore.user) {
      authStore.authenticate({
        id: generateUUID(),
        name: "",
        createdAt: Date.now(),
      });
    }
  }, [mounted]);

  return (
    <AuthContext.Provider value={authStore}>
      {children}
    </AuthContext.Provider>
  );
};
