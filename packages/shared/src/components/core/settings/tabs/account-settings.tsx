import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../../../stores/auth.store";
import { AccountForm } from "../components/account/account-form";
import { CalendarPermissions } from "../components/account/calendar-permissions";
import { LoginProtected } from "../components/common/login-protected";
import { useShallow } from "zustand/shallow";

export const AccountSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    })),
  );

  if (!user) return <LoginProtected />;

  return (
    <div className="flex h-full flex-col">
      <p className="text-sm font-normal leading-snug text-foreground/70">
        {t("settings.account.description")}
      </p>
      <div className="flex-1 overflow-y-auto">
        <AccountForm user={user} />
        <CalendarPermissions />
      </div>
    </div>
  );
};
