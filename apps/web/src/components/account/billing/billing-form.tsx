import { useEffect, useState } from "react";

import { api } from "@/api";
import { toast } from "sonner";

import { AuthUser } from "@/types/auth";
import { PlanInterval, Subscription } from "@/types/subscription";
import { cn, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/utils/common.utils";

import { Icons } from "../../icons/icons";
import { Plans } from "./plans";

export const BillingForm = ({ user }: { user: AuthUser }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<Subscription | null>(
    null
  );

  useEffect(() => {
    (async () => {
      try {
        if (user.subscriptionId) {
          setIsLoading(true);
          const subscription = await api.billing.getSubscription({
            subscriptionId: user.subscriptionId,
          });

          setSubscriptionPlan(subscription);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onManageSubscription = async () => {
    setIsLoadingPortal(true);

    try {
      if (user.subscriptionId) {
        const portal = await api.billing.getLemonSqueezyPortalUrl({
          subscriptionId: user.subscriptionId,
        });

        if (portal) {
          window.location.href = portal.url;
        }
      }
    } catch (error) {
      return toast.error("Something went wrong.", {
        description: "Subscription portal can't be accessed. Please try again.",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const onOpenCheckout = async (plan: PlanInterval) => {
    setIsLoadingPortal(true);

    try {
      const allPlanIds: {
        [key in PlanInterval]: string;
      } = {
        monthly: env.VITE_LEMON_SQUEEZY_MONTHLY_VARIANT_ID as string,
        yearly: env.VITE_LEMON_SQUEEZY_YEARLY_VARIANT_ID as string,
        lifetime: env.VITE_LEMON_SQUEEZY_LIFETIME_VARIANT_ID as string,
      };

      const planId: string = allPlanIds[plan as PlanInterval];

      const checkout = await api.billing.getLemonSqeezyCheckoutUrl({
        variantId: planId,
      });

      if (checkout) {
        window.location.href = checkout.url;
        // (window as any).LemonSqueezy.Url.Open(checkout.url);
        // window.LemonSqueezy.Url.Open(checkout.url);
      }
    } catch (error) {
      return toast.error("Something went wrong.", {
        description:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any)?.message ||
          "Checkout portal not working. Please try again.",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  if (isLoading) {
    return <SkeletonSubscription />;
  }

  return (
    <div className="space-y-6">
      {subscriptionPlan ? (
        <ProPlanSection
          subscriptionPlan={subscriptionPlan}
          isLoadingPortal={isLoadingPortal}
          onManageSubscription={onManageSubscription}
        />
      ) : (
        <FreePlanSection
          isLoadingPortal={isLoadingPortal}
          onOpenCheckout={onOpenCheckout}
        />
      )}
    </div>
  );
};

function SkeletonSubscription() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

function ProPlanSection({
  subscriptionPlan,
  isLoadingPortal,
  onManageSubscription,
}: {
  subscriptionPlan: Subscription;
  isLoadingPortal: boolean;
  onManageSubscription: () => void;
}) {
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

function FreePlanSection({
  isLoadingPortal,
  onOpenCheckout,
}: {
  isLoadingPortal: boolean;
  onOpenCheckout: (plan: PlanInterval) => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanInterval>();
  const [showError, setShowError] = useState(false);
  const IS_PAYMENTS_ENABLED = false;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Free Plan</h3>
        <p className="text-sm text-foreground/70">
          You are currently on the{" "}
          <strong className="font-semibold">Free</strong> plan.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-base font-medium">Switch to Pro</h4>
          <p className="text-sm text-foreground/70">
            Upgrade to a paid plan for additional features.
          </p>
        </div>

        <Plans onPlanChange={(plan) => setSelectedPlan(plan)} />

        {showError && (
          <p className="text-sm text-red-500">
            Please select a plan above to continue.
          </p>
        )}

        <div className="border-t pt-4">
          <button
            className={cn(buttonVariants())}
            disabled={isLoadingPortal}
            onClick={() => {
              if (!IS_PAYMENTS_ENABLED) {
                return toast("Payments are disabled for now.", {
                  description:
                    "Please contact the administrator to enable payments.",
                });
              }
              if (!selectedPlan) {
                setShowError(true);
                return;
              }
              setShowError(false);
              onOpenCheckout(selectedPlan);
            }}
          >
            {isLoadingPortal && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Upgrade to PRO
          </button>
        </div>
      </div>
    </div>
  );
}
