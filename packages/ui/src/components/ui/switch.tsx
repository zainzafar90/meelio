import * as React from "react";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@repo/ui/lib/utils";

type SwitchSize = "sm" | "md" | "lg";

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: SwitchSize;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: {
      root: "h-4 w-7",
      thumb: "h-3 w-3",
      translate: props.checked ? "translate-x-3" : "translate-x-0",
    },
    md: {
      root: "h-5 w-9",
      thumb: "h-4 w-4",
      translate: props.checked ? "translate-x-4" : "translate-x-0",
    },
    lg: {
      root: "h-6 w-11",
      thumb: "h-5 w-5",
      translate: props.checked ? "translate-x-5" : "translate-x-0",
    },
  };

  return (
    <SwitchPrimitives.Root
      className={cn(
        "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ring-offset-background transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size].root,
        props.checked ? "bg-accent" : "bg-gray-200",
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          sizeClasses[size].translate,
          sizeClasses[size].thumb,
          "pointer-events-none block transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
