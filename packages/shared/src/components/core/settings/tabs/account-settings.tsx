import { Button } from "@repo/ui/components/ui/button";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";

import { useAuthStore } from "../../../../stores/auth.store";
import { useAuthActionsStore } from "../../../../stores/auth-actions.store";
import { AccountForm } from "../components/account/account-form";

export const AccountSettings = () => {
  const { t } = useTranslation();
  const user = useAuthStore(useShallow((state) => state.user));
  const { isSignedIn, actions } = useAuthActionsStore(
    useShallow((state) => ({ isSignedIn: state.isSignedIn, actions: state.actions })),
  );

  if (!user) return null;

  return (
    <div className="flex h-full flex-col gap-4">
      <p className="text-sm font-normal leading-snug text-foreground/70">
        {t("settings.account.description")}
      </p>

      {actions && isSignedIn !== null && (
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium">
              {isSignedIn ? "Signed in" : "Not signed in"}
            </p>
            <p className="text-xs text-foreground/60">
              {isSignedIn
                ? "Sync settings and data across devices."
                : "Sign in with Google to sync across devices."}
            </p>
          </div>
          <Button
            variant={isSignedIn ? "outline" : "default"}
            size="sm"
            onClick={() => void (isSignedIn ? actions.signOut() : actions.signIn())}
          >
            {isSignedIn ? "Sign out" : "Sign in with Google"}
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <AccountForm user={user} />
      </div>
    </div>
  );
};
