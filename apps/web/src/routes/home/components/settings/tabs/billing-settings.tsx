import { useAuthStore } from "@/stores/auth.store";

import { BillingForm } from "../components/billing/billing-form";

export const BillingSettings = () => {
  const user = useAuthStore((state) => state.user);

  if (!user)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Please login to view this page.
        </div>
      </div>
    );

  return <BillingForm user={user} />;
};
