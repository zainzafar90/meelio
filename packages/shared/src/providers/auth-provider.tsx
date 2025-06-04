import { ReactNode, useEffect, useState } from "react";
// import { QueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../stores/auth.store";
import { api } from "../api";
import { AuthContext } from "../context/auth-context";
import { useShallow } from "zustand/shallow";
import { ExtensionRedirectDialog } from "../components/auth/extension-redirect-dialog";
import {
  migrateGuestDataToUser,
  cleanupGuestData,
} from "../utils/guest-migration.utils";
import { clearLocalData } from "../utils/clear-data.utils";
import { toast } from "sonner";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      (async () => {
        const DELAY = authStore.user ? 3000 : 0;
        setTimeout(async () => {
          try {
            const response = await api.auth.getAuthenticatedAccount();
            const user = response;

            if (user.data) {
              const shouldMigrate =
                localStorage.getItem("meelio:migrate_guest") === "true";

              if (authStore.guestUser) {
                if (shouldMigrate) {
                  const summary = await migrateGuestDataToUser(
                    authStore.guestUser.id,
                    user.data.id
                  );

                  if (summary.success && summary.tasks.migratedCount > 0) {
                    toast.success(
                      `Migrated ${summary.tasks.migratedCount} tasks to your account`,
                      {
                        description:
                          "Your guest data has been successfully transferred.",
                        duration: 5000,
                      }
                    );
                  }

                  await cleanupGuestData(authStore.guestUser.id);
                  localStorage.removeItem("meelio:migrate_guest");
                }

                await clearLocalData();
              } else {
                await clearLocalData();
              }

              authStore.authenticate(user.data);
              authStore.authenticateGuest(null as any);
            }
          } catch (error) {
            authStore.authenticate(null as any);
          }
        }, DELAY);
      })();
    }
  }, [mounted]);

  return (
    <AuthContext.Provider value={authStore}>
      {children}
      <ExtensionRedirectDialog />
    </AuthContext.Provider>
  );
};
