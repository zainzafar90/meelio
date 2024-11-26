import { useTranslation } from "react-i18next";

import { AccountForm } from "@/components/account/account-form";
import { useAuthStore } from "@/stores/auth.store";

export const AccountSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  if (!user)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Please login to view this page.
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <p className="text-sm font-normal leading-snug text-foreground/70">
        {t("settings.account.description")}
      </p>
      <AccountForm user={user} />
    </div>
  );
};
