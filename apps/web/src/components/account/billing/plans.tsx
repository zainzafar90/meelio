import { useState } from "react";

import { PlanInterval } from "@/types/subscription";
import { Label } from "@/components/ui/label";

import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";

const allPlans = [
  {
    value: "monthly",
    label: "Monthly",
    price: 2,
    priceLabel: "/ Mo",
    description: "Billed Montly",
  },
  {
    value: "yearly",
    label: "Yearly",
    price: 20,
    priceLabel: "/ Yr",
    description: "Billed Yearly (20% Off)",
  },
  {
    value: "lifetime",
    label: "Lifetime",
    price: 30,
    priceLabel: "/ Lifetime",
    description: "Pay Once Use Forever",
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
      className="overflow-x-scroll no-scrollbar flex py-4 gap-y-6 gap-x-4 pr-24 px-1"
    >
      {allPlans.map((plan) => (
        <div key={plan.value}>
          <Label
            htmlFor={plan.value}
            className="relative flex min-w-48 flex-shrink-0 cursor-pointer rounded-lg border bg-background/50 p-4 shadow-sm select-none focus:outline-none border-foreground/20 hover:border-foreground/50 transition [&:has([data-state=checked])]:border-accent [&:has([data-state=checked])]:ring-1 [&:has([data-state=checked])]:ring-accent"
          >
            <RadioGroupItem
              id={plan.value}
              value={plan.value}
              className="peer sr-only"
            />
            <div className="flex gap-4 flex-1 px-2">
              <div className="flex flex-col">
                <span className="block text-base font-medium text-foreground/90">
                  {plan.price}${" "}
                  <small className="align-baseline opacity-90 uppercase">
                    {plan.priceLabel}
                  </small>
                </span>
                <span className="mt-1 flex max-w-[12rem] items-center text-sm text-foreground/50 font-normal">
                  {plan.description}
                </span>
              </div>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
