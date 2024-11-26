import { useTranslation } from "react-i18next";

import { BillingForm } from "@/components/account/billing/billing-form";
import { useAuthStore } from "@/stores/auth.store";

export const BillingSettings = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  console.log(user);

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
      <p className="text-sm text-muted-foreground">
        {t("settings.billing.description")}
      </p>
      <BillingForm user={user} />
    </div>
  );
};
