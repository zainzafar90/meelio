import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../../../stores/auth.store";
import { AccountForm } from "../components/account/account-form";
import { LoginProtected } from "../components/common/login-protected";

export const AccountSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  if (!user) return <LoginProtected />;

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
