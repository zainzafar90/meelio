import React, { useState, useId, useEffect } from "react";
import { Icons } from "../icons/icons";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { StarField } from "../auth/star-field";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { cn } from "@repo/ui/lib/utils";
import { api } from "../../api";
import { PlanInterval } from "../../types/subscription";
import { env } from "../../utils/env.utils";
import { toast } from "sonner";
import { useAuthStore } from "../../stores/auth.store";
import { UserAuthForm } from "../auth/user-auth-form";

interface PremiumFeatureTooltipProps {
  featureName?: string;
  description?: string;
  benefits?: string[];
  inline?: boolean;
  className?: string;
  tooltipClassName?: string;
  children: React.ReactNode;
}

interface Plan {
  id: string;
  title: string;
  price: string;
  period: string;
  description: string;
  discount?: string;
  trial?: string;
}

/**
 * A sleek, modern tooltip component for premium features
 *
 * @param featureName The name of the premium feature
 * @param description Optional description of the premium feature
 * @param benefits Optional list of benefits for the premium feature
 * @param inline Whether to display the tooltip trigger inline (default: false)
 * @param className Optional additional classes for the tooltip trigger
 */
export const PremiumFeatureTooltip: React.FC<PremiumFeatureTooltipProps> = ({
  featureName,
  description,
  benefits = [],
  className = "",
  tooltipClassName = "",
  children,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const { user } = useAuthStore();

  return (
    <>
      <div
        className={cn("relative cursor-pointer", className)}
        onClick={() => setShowModal(true)}
      >
        <span
          className={cn(
            "absolute -top-1 -right-2 z-10 bg-sky-600 text-[6px] font-bold uppercase tracking-wider text-white/90 px-1 py-0.5 rounded border border-white/10",
            tooltipClassName
          )}
        >
          Pro
        </span>
        {children}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-full max-w-md md:max-w-4xl border-0 shadow-xl p-0 overflow-hidden bg-transparent max-h-[95vh]">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>{featureName}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
          </VisuallyHidden>
          {/* Wrapper with rounded corners for everything */}
          <div className="bg-white rounded-lg overflow-hidden w-full max-h-full flex flex-col md:flex-row">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 rounded-full bg-zinc-800/50 p-2 hover:bg-zinc-800"
              onClick={() => setShowModal(false)}
            >
              <Icons.close className="h-4 w-4 text-white/80" />
            </button>

            {/* Left section with starry background - hidden on small screens */}
            <div className="hidden md:block md:flex-1 relative overflow-hidden bg-gray-950/50 backdrop-blur-sm">
              <PremiumGlow />
              <div className="relative flex flex-col items-start justify-center w-full h-full p-8 md:p-12">
                <div className="relative z-10">
                  <StarField />
                  <PremiumIntro />
                </div>
              </div>
            </div>

            {/* Right section with pricing cards or auth form - full width on small screens */}
            <div className="flex-1 w-full overflow-y-auto max-w-full md:max-w-sm">
              {showAuthForm ? (
                <div className="p-6">
                  <UserAuthForm
                    userName={user?.name || "there"}
                    onGuestContinue={() => setShowAuthForm(false)}
                  />
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => setShowAuthForm(false)}
                  >
                    Back to Plans
                  </Button>
                </div>
              ) : (
                <PricingSection
                  featureName={featureName}
                  benefits={benefits}
                  onNeedAuth={() => setShowAuthForm(true)}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const PremiumGlow = () => {
  const id = useId();

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-gray-950">
      <svg className="absolute -bottom-48 left-[-40%] h-[80rem] w-[180%] lg:-right-40 lg:bottom-auto lg:left-auto lg:top-[-40%] lg:h-[180%] lg:w-[80rem]">
        <defs>
          <radialGradient id={`${id}-desktop`} cx="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.3)" />
            <stop offset="53.95%" stopColor="rgba(0, 71, 255, 0.09)" />
            <stop offset="100%" stopColor="rgba(10, 14, 23, 0)" />
          </radialGradient>
          <radialGradient id={`${id}-mobile`} cy="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.3)" />
            <stop offset="53.95%" stopColor="rgba(0, 71, 255, 0.09)" />
            <stop offset="100%" stopColor="rgba(10, 14, 23, 0)" />
          </radialGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-desktop)`}
          className="hidden lg:block"
        />
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-mobile)`}
          className="lg:hidden"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 right-0 h-px bg-white mix-blend-overlay lg:left-auto lg:top-0 lg:h-auto lg:w-px" />
    </div>
  );
};

const PremiumIntro = () => {
  const features = [
    "Unlimited focus-time & analytics",
    "Site blocking and tab stashing",
    "Unlock premium soundscapes",
    "Priority support & much more",
  ];

  return (
    <div className="py-12 px-6">
      <div className="text-amber-400 uppercase tracking-wider text-sm font-light mb-2">
        MEELIO PREMIUM
      </div>
      <h1 className="mt-4 font-display text-3xl/tight font-light text-white">
        Elevate Focus, <br />
        <span className="text-sky-300">Boost Productivity</span>
      </h1>

      <div className="flex flex-col space-y-6 my-12">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-full bg-white/10 p-1">
              <Icons.check className="h-3 w-3 text-white" />
            </div>
            <span className="text-white text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <div className="italic text-white/70 mb-4 font-light">
          I've been using Meelio for a few months now and it's been a game
          changer for me.
        </div>
        <div className="flex items-center gap-1">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Icons.star
                key={i}
                className="h-5 w-5 text-amber-400 fill-amber-400"
              />
            ))}
        </div>
      </div>
    </div>
  );
};

const PricingSection = ({
  featureName,
  benefits = [],
  onNeedAuth,
}: {
  featureName: string;
  benefits?: string[];
  onNeedAuth: () => void;
}) => {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>("yearly");
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const plans: Plan[] = [
    {
      id: "monthly",
      title: "Monthly",
      price: "$5",
      period: "/ mo",
      description: "Billed Monthly",
    },
    {
      id: "yearly",
      title: "Annual",
      price: "$40",
      period: "/ yr",
      description: "Billed Yearly",
      discount: "20% off",
      trial: "Free for 7 days",
    },
    {
      id: "lifetime",
      title: "Lifetime",
      price: "$89",
      period: "",
      description: "One-time payment",
    },
  ];

  const renderBenefitItem = (benefit: string, index: number) => (
    <div key={index} className="flex items-center gap-2">
      <div className="flex-shrink-0 rounded-full bg-sky-100 p-1">
        <Icons.check className="h-3 w-3 text-sky-600" />
      </div>
      <span className="text-sm text-gray-600">{benefit}</span>
    </div>
  );

  const renderPlanCard = (plan: Plan) => (
    <div
      key={plan.id}
      className={`relative rounded-md transition-all cursor-pointer ${
        selectedPlan === plan.id
          ? "ring-1 ring-sky-500 bg-sky-50 border border-sky-500"
          : "hover:bg-gray-50 border border-gray-200"
      }`}
      onClick={() => setSelectedPlan(plan.id)}
    >
      {plan.discount && (
        <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs px-1.5 py-0.5 rounded-bl-sm">
          {plan.discount}
        </div>
      )}

      <div className="p-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{plan.title}</h3>
          <p className="text-xs text-gray-500">{plan.description}</p>
          {plan.trial && (
            <div className="text-sky-600 text-xs font-medium">{plan.trial}</div>
          )}
        </div>

        <div className="text-right flex items-center gap-2">
          <div className="text-base font-semibold text-gray-900 flex items-baseline">
            {plan.price}
            <span className="text-xs text-gray-500 ml-0.5">{plan.period}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const onOpenCheckout = async (plan: PlanInterval) => {
    // If no user, show auth form
    if (!user) {
      onNeedAuth();
      return;
    }

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
        window.open(checkout.data.url, "_blank");
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

  return (
    <div className="p-6 flex flex-col justify-center h-full">
      {/* Mobile-only feature info */}
      <div className="md:hidden mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{featureName}</h2>
        {benefits.length > 0 && (
          <div className="mt-3 space-y-2">
            {benefits.map(renderBenefitItem)}
          </div>
        )}
      </div>

      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Choose your plan
      </h2>

      <div className="space-y-2 mb-4">{plans.map(renderPlanCard)}</div>

      <Button
        disabled={isLoadingPortal}
        className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white mb-4"
        onClick={() => onOpenCheckout(selectedPlan as PlanInterval)}
      >
        {isLoadingPortal ? "Loading..." : "Upgrade to Pro"}
      </Button>

      <div className="flex justify-center gap-3 pt-3 text-xs text-gray-500 border-t border-gray-100">
        <button className="hover:text-gray-900">Support</button>
        <span>•</span>
        <button className="hover:text-gray-900">Terms</button>
      </div>
    </div>
  );
};
