import { useEffect } from "react";
import { AppProvider, useAppStore, useAuthActionsStore } from "@repo/shared";

import { Router } from "@/routes/router";
import { authClient } from "@/auth";

export const App = () => {
  useAppStore.getState().setPlatform("web");

  useEffect(() => {
    const store = useAuthActionsStore.getState();
    store.setActions({
      signIn: () =>
        authClient.signIn.social({
          provider: "google",
          callbackURL: `${window.location.origin}/`,
        }),
      signOut: async () => {
        await authClient.signOut();
        useAuthActionsStore.getState().setIsSignedIn(false);
      },
    });
    void authClient.getSession().then((s) => {
      useAuthActionsStore.getState().setIsSignedIn(s.data !== null);
    });
  }, []);

  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
};
