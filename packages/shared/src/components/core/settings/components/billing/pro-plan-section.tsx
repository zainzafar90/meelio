import { buttonVariants } from "@repo/ui/components/ui/button";

import { Subscription } from "../../../../../types/subscription";
import { cn, formatDate } from "../../../../../lib/utils";
import { Icons } from "../../../../../components/icons/icons";

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
    const isSubscriptionActive = 
      subscription.status === "active" ||
      subscription.status === "on_trial" ||
      subscription.status === "past_due" ||
      subscription.status === "paused";
    const isCancelledSubscriptionCurrentlyValid =
      subscription.status === "cancelled" &&
      subscription.endsAt &&
      new Date(subscription.endsAt) > new Date();

    return isSubscriptionActive || isCancelledSubscriptionCurrentlyValid;
  };

  const getSubscriptionStatusBadge = (subscription: Subscription) => {
    if (subscription.status === "active") {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Active
        </span>
      );
    }
    if (subscription.status === "cancelled") {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
          Auto-Renew Off
        </span>
      );
    }

    if (subscription.status === "on_trial") {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          Trial
        </span>
      );
    }

    if (subscription.status === "past_due") {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Past Due
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Subscription Plan</h3>
          {getSubscriptionStatusBadge(subscriptionPlan)}
        </div>
        <p className="text-sm text-foreground/70">
          You are currently on the{" "}
          <strong className="font-semibold">
            {subscriptionPlan.productName}
          </strong>{" "}
          plan.
        </p>
      </div>

      <div className="space-y-2">
        {subscriptionPlan.status === "cancelled" ? (
          <>
            <p className="text-sm text-foreground/70">
              Your subscription has been cancelled and will end on{" "}
              <strong className="font-semibold">
                {subscriptionPlan.endsAt && formatDate(subscriptionPlan.endsAt)}
              </strong>
            </p>
            <p className="text-sm text-foreground/70">
              You will lose access to premium features after this date unless
              you reactivate your subscription.
            </p>
          </>
        ) : (
          <p className="text-sm text-foreground/70">
            Your plan will automatically renew on{" "}
            <strong className="font-semibold">
              {subscriptionPlan.renewsAt &&
                formatDate(subscriptionPlan.renewsAt)}
            </strong>
          </p>
        )}

        {subscriptionPlan.trialEndsAt && (
          <p className="text-sm text-foreground/70">
            Trial ends on{" "}
            <strong className="font-semibold">
              {formatDate(subscriptionPlan.trialEndsAt)}
            </strong>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Manage Subscription</p>
          <p className="text-sm text-foreground/70">
            Update your plan, payment method, or billing information
          </p>
        </div>
        <button
          className={cn(buttonVariants())}
          disabled={isLoadingPortal}
          onClick={onManageSubscription}
        >
          {isLoadingPortal && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isProSubscriptionValid(subscriptionPlan) ? "Manage" : "Upgrade Plan"}
        </button>
      </div>
    </div>
  );
}
