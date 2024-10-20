import { useEffect, useState } from "react";

import { api } from "@/api";
import { toast } from "sonner";

import { AuthUser } from "@/types/auth";
import { PlanInterval, Subscription } from "@/types/subscription";
import { cn, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-8">
      {subscriptionPlan ? (
        <ProPlanCard
          subscriptionPlan={subscriptionPlan}
          isLoadingPortal={isLoadingPortal}
          onManageSubscription={onManageSubscription}
        />
      ) : (
        <FreePlanCard
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

function ProPlanCard({
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
    <Card className="bg-background">
      <CardHeader>
        <CardTitle className="text-md">Subscription Plan</CardTitle>
        <CardDescription className="text-foreground/70">
          You are currently on the{" "}
          <strong className="font-semibold">
            {subscriptionPlan.productName}
          </strong>{" "}
          plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        {isProSubscriptionValid(subscriptionPlan) ? (
          <p className="rounded-full text-xs">
            {subscriptionPlan.cancelled
              ? "Your plan will be canceled on "
              : "Your plan renews on "}
            <strong className="font-semibold">
              {subscriptionPlan.renewsAt &&
                formatDate(subscriptionPlan.renewsAt)}
            </strong>
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="p-4 border-t rounded-b-md border-grey-200 bg-background/80 text-foreground">
        <div className="flex flex-col items-start justify-between sm:w-full sm:flex-row sm:items-center">
          <p className="pb-4 sm:pb-0">
            Manage your subscription plan and billing information.
          </p>
          <button
            className={cn(buttonVariants(), "sm:ml-auto")}
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
      </CardFooter>
    </Card>
  );
}

function FreePlanCard({
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
    <Card className="bg-background">
      <CardHeader>
        <CardTitle className="text-md">Free Plan</CardTitle>
        <CardDescription className="text-foreground/70">
          You are currently on the{" "}
          <strong className="font-semibold">Free</strong> plan.
        </CardDescription>
      </CardHeader>
      <hr />
      <CardContent className="mt-4 text-sm flex flex-col space-y-2">
        <CardTitle className="text-md">Switch to Pro </CardTitle>
        <CardDescription className="text-foreground/70">
          Upgrade to a paid plan for additional features.
          <br /> Choose a plan below to get started.
        </CardDescription>
        <Plans onPlanChange={(plan) => setSelectedPlan(plan)} />
        {showError && (
          <p className="text-sm text-red-500">
            Please select a plan to above to continue.
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t rounded-b-md border-grey-200 bg-background/80 text-foreground">
        <div className="flex flex-col items-start justify-between sm:w-full sm:flex-row sm:items-center">
          <button
            className={cn(buttonVariants(), "mb-4 sm:mb-0")}
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

          <p className="sm:ml-auto">
            Upgrade to a paid plan for additional features.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
