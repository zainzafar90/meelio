import { useState } from "react";

import { Button, buttonVariants } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";

import { PlanInterval } from "../../../../../types/subscription";
import { Icons } from "../../../../../components/icons/icons";

import { Plans } from "./plans";

interface FreePlanSectionProps {
  isLoadingPortal: boolean;
  onOpenCheckout: (plan: PlanInterval) => void;
}

export function FreePlanSection({
  isLoadingPortal,
  onOpenCheckout,
}: FreePlanSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanInterval>();
  const [showError, setShowError] = useState(false);
  const IS_PAYMENTS_ENABLED = true;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Free Plan</h3>
        <p className="text-sm text-foreground/70">
          You are currently on the{" "}
          <strong className="font-semibold">Free</strong> plan.
        </p>
      </div>

      <div className="space-y-4 w-full">
        <div>
          <p className="text- text-foreground/70">
            Upgrade to a paid plan for additional features.
          </p>
        </div>

        <Plans onPlanChange={(plan) => setSelectedPlan(plan)} />

        {showError && (
          <p className="text-sm text-red-500">
            Please select a plan above to continue.
          </p>
        )}



          <Button
        disabled={isLoadingPortal}
        className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white mb-4"
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
            Upgrade to PRO

      </Button>
      </div>
    </div>
  );
}
