import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../../../stores/auth.store";
import { AccountForm } from "../components/account/account-form";
import { useShallow } from "zustand/shallow";
import { generateUUID } from "../../../../utils/common.utils";

export const AccountSettings = () => {
  const { t } = useTranslation();
  const { user, guestUser, authenticate } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
      authenticate: state.authenticate,
    }))
  );

  const handleCreateProfile = () => {
    authenticate({
      id: guestUser?.id || generateUUID(),
      name: guestUser?.name || "User",
      createdAt: Date.now(),
    });
  };

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 py-12">
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Create a profile to personalize your experience
        </p>
        <button
          onClick={handleCreateProfile}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <p className="text-sm font-normal leading-snug text-foreground/70">
        {t("settings.account.description")}
      </p>
      <div className="flex-1 overflow-y-auto">
        <AccountForm user={user} />
      </div>
    </div>
  );
};
