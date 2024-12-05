import { buttonVariants } from "@repo/ui/components/ui/button";

import { Subscription } from "@/types/subscription";
import { cn, formatDate } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";

interface ProPlanSectionProps {
  subscriptionPlan: Subscription;
  isLoadingPortal: boolean;
  onManageSubscription: () => void;
}

export function ProPlanSection({
  subscriptionPlan,
  isLoadingPortal,
  onManageSubscription,
}: ProPlanSectionProps) {
  const isProSubscriptionValid = (subscription: Subscription) => {
    const isSubscriptionActive = subscription.status === "active";
    const isCancelledSubscriptionCurrentlyValid =
      subscription.status === "cancelled" &&
      subscription.endsAt &&
      subscription.endsAt > new Date();

    return isSubscriptionActive || isCancelledSubscriptionCurrentlyValid;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Subscription Plan</h3>
        <p className="text-sm text-foreground/70">
          You are currently on the{" "}
          <strong className="font-semibold">
            {subscriptionPlan.productName}
          </strong>{" "}
          plan.
        </p>
      </div>

      {isProSubscriptionValid(subscriptionPlan) && (
        <p className="text-sm">
          {subscriptionPlan.cancelled
            ? "Your plan will be canceled on "
            : "Your plan renews on "}
          <strong className="font-semibold">
            {subscriptionPlan.renewsAt && formatDate(subscriptionPlan.renewsAt)}
          </strong>
        </p>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm text-foreground/70">
          Manage your subscription plan and billing information.
        </p>
        <button
          className={cn(buttonVariants())}
          disabled={isLoadingPortal}
          onClick={onManageSubscription}
        >
          {isLoadingPortal && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isProSubscriptionValid(subscriptionPlan)
            ? "Open Customer Portal"
            : "Upgrade to PRO"}
        </button>
      </div>
    </div>
  );
}
