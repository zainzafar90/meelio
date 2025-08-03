import { useState } from "react";

import { Label } from "@repo/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/ui/radio-group";

import { PlanInterval } from "../../../../../types/subscription";
import { plansData } from "../../../../../data";
import { PlanCard } from "../../../../common/plan-card";

export const Plans = ({
  onPlanChange,
}: {
  onPlanChange: (plan: PlanInterval) => void;
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanInterval>();

  return (
    <RadioGroup
      defaultValue="montly"
      value={selectedPlan}
      onValueChange={(value: PlanInterval) => {
        setSelectedPlan(value);
        onPlanChange(value);
      }}
      className="no-scrollbar space-y-2 overflow-x-scroll px-1 py-4 mb-4"
    >
      {plansData.map((plan) => (
        <div key={plan.value} className="relative">
          <Label htmlFor={plan.value} className="absolute inset-0 z-10 cursor-pointer">
            <RadioGroupItem
              id={plan.value}
              value={plan.value}
              className="peer sr-only"
            />
          </Label>
          <PlanCard
            plan={plan}
            isSelected={selectedPlan === plan.value}
            onClick={() => {
              setSelectedPlan(plan.value);
              onPlanChange(plan.value);
            }}
            className="relative"
            variant="dark"
          />
        </div>
      ))}
    </RadioGroup>
  );
};
