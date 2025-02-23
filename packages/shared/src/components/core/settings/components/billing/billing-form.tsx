import { useEffect, useState } from "react";

import { toast } from "sonner";

import { AuthUser } from "../../../../../types/auth";
import { Subscription, PlanInterval } from "../../../../../types/subscription";
import { api } from "../../../../../api";
import { env } from "../../../../../utils";
import { FreePlanSection } from "./free-plan-section";
import { ProPlanSection } from "./pro-plan-section";
import { SkeletonSubscription } from "./skeleton-subscription";

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

          setSubscriptionPlan(subscription?.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
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
        monthly: env.lemonSqueezyMonthlyVariantId,
        yearly: env.lemonSqueezyYearlyVariantId,
        lifetime: env.lemonSqueezyLifetimeVariantId,
      };

      const planId: string = allPlanIds[plan as PlanInterval];

      const checkout = await api.billing.getLemonSqeezyCheckoutUrl({
        variantId: planId,
      });

      if (checkout?.data?.url) {
        window.location.href = checkout.data.url;
      }
    } catch (error) {
      return toast.error("Something went wrong.", {
        description:
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
