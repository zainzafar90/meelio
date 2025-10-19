import { ReactNode, useEffect, useState } from "react";

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
import { useSyncStore } from "../stores/sync.store";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const { isOnline } = useSyncStore(
    useShallow((state) => ({
      isOnline: state.isOnline,
    }))
  );

  const authStore = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
      authenticate: state.authenticate,
      authenticateGuest: state.authenticateGuest,
      loading: state.loading,
      logout: state.logout,
      lastSuccessfulAuth: state.lastSuccessfulAuth,
      updateLastSuccessfulAuth: state.updateLastSuccessfulAuth,
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
        if (!isOnline) return;

        const DELAY = authStore.user ? 3000 : 0;
        setTimeout(async () => {
          try {
            const response = await api.auth.getAuthenticatedAccount();
            const user = response;

            if (user.data) {
              const shouldMigrate =
                localStorage.getItem("meelio:local:migrate_guest") === "true";

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
                  localStorage.removeItem("meelio:local:migrate_guest");
                }

                await clearLocalData();
              }
              authStore.authenticate(user.data);
              authStore.authenticateGuest(null as any);
              authStore.updateLastSuccessfulAuth();
            }
          } catch (error) {
            // Check if user was authenticated within the last 24 hours
            const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
            const now = Date.now();
            const lastAuth = authStore.lastSuccessfulAuth;

            // Only log out if:
            // 1. There's no lastSuccessfulAuth timestamp (first time user), OR
            // 2. Last successful auth was more than 24 hours ago
            if (!lastAuth || now - lastAuth > TWENTY_FOUR_HOURS_MS) {
              authStore.authenticate(null as any);
            } else {
              // User is within grace period, keep them logged in
            }
          }
        }, DELAY);
      })();
    }
  }, [mounted]);
  return (
    <AuthContext.Provider
      value={{ ...authStore, logoutUser: authStore.logout }}
    >
      {children}
      <ExtensionRedirectDialog />
    </AuthContext.Provider>
  );
};
