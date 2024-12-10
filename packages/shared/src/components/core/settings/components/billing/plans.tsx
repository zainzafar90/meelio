import { useState } from "react";

import { Label } from "@repo/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/ui/radio-group";

import { PlanInterval } from "../../../../../types/subscription";

const allPlans = [
  {
    value: "monthly",
    label: "Monthly",
    price: 4,
    priceLabel: "/ mo",
    description: "Billed Montly",
  },
  {
    value: "yearly",
    label: "Yearly",
    price: 40,
    priceLabel: "/ yr",
    description: "Billed Yearly",
  },
  {
    value: "lifetime",
    label: "Lifetime",
    price: 100,
    priceLabel: "/ Lifetime",
    description: "Use Forever",
  },
];

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
      className="no-scrollbar flex flex-wrap gap-x-4 gap-y-6 overflow-x-scroll px-1 py-4 pr-24"
    >
      {allPlans.map((plan) => (
        <div key={plan.value}>
          <Label
            htmlFor={plan.value}
            className="relative flex flex-shrink-0 cursor-pointer select-none flex-wrap rounded-lg border border-foreground/20 bg-background/50 p-4 shadow-sm transition hover:border-foreground/50 focus:outline-none [&:has([data-state=checked])]:border-accent [&:has([data-state=checked])]:ring-1 [&:has([data-state=checked])]:ring-accent"
          >
            <RadioGroupItem
              id={plan.value}
              value={plan.value}
              className="peer sr-only"
            />
            <div className="flex min-w-max flex-1 gap-4 px-2">
              <div className="flex flex-col">
                <span className="block text-sm font-medium text-foreground/90">
                  {plan.price}${" "}
                  <small className="align-baseline text-xs uppercase opacity-90">
                    {plan.priceLabel}
                  </small>
                </span>
                <span className="mt-1 flex items-center text-xs font-normal text-foreground/50">
                  {plan.description}
                </span>
              </div>
            </div>

            {plan.value === "yearly" && (
              <div className="absolute -inset-x-[1px] -top-2">
                <div className="flex w-full items-start justify-center rounded-t-md bg-accent py-1 text-center text-xs uppercase text-background">
                  20% off
                </div>
              </div>
            )}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
