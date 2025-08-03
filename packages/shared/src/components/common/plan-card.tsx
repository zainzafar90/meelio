import React from "react";
import { cn } from "@repo/ui/lib/utils";
import { PlanData } from "../../data/plans-data";

interface PlanCardProps {
  plan: PlanData;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  variant?: "light" | "dark";
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected,
  onClick,
  className,
  variant = "light",
}) => {
  const isLight = variant === "light";
  
  return (
    <div
      className={cn(
        "relative rounded-md transition-all cursor-pointer",
        isSelected
          ? isLight 
            ? "ring-1 ring-sky-500 bg-sky-50 border border-sky-500"
            : "ring-1 ring-sky-500 bg-background/80 border border-sky-500"
          : isLight
            ? "hover:bg-gray-50 border border-gray-200"
            : "hover:bg-background/60 border border-foreground/20",
        className
      )}
      onClick={onClick}
    >
      {plan.discount && (
        <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs px-1.5 py-0.5 rounded-bl-sm">
          {plan.discount}
        </div>
      )}

      <div className="p-3 flex items-center justify-between">
        <div>
          <h3 className={cn(
            "text-sm font-medium",
            isLight ? "text-gray-900" : "text-foreground"
          )}>
            {plan.title} <span className="uppercase text-xs opacity-50">{plan.priceLabelDescription}</span>
          </h3>
          <p className={cn(
            "text-[12px]",
            isLight ? "text-gray-500" : "text-foreground/60"
          )}>
            {plan.description}
          </p>
          {plan.trial && (
            <div className="text-sky-600 text-xs font-medium">{plan.trial}</div>
          )}
        </div>

        <div className="text-right flex items-center gap-2">
          <div className={cn(
            "text-base font-semibold flex items-baseline",
            isLight ? "text-gray-900" : "text-foreground"
          )}>
            {plan.priceDisplay}
            <span className={cn(
              "text-xs ml-0.5",
              isLight ? "text-gray-500" : "text-foreground/60"
            )}>
              {plan.priceLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};