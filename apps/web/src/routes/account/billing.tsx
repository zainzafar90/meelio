import { AuthUser } from "@/types/auth";
import { BillingForm } from "@/components/account/billing/billing-form";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/layouts/app-layout";
import { useAuthStore } from "@/store/auth.store";

const Billing = () => {
  const user = useAuthStore((state) => state.user) || ({} as AuthUser);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Billing</h3>
          <p className="font-normal text-sm leading-snug text-foreground/70">
            Manage billing and your subscription plan.
          </p>
        </div>
        <Separator />
        <BillingForm user={user} />
      </div>
    </AppLayout>
  );
};

export default Billing;
