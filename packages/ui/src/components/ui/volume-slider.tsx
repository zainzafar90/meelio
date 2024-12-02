import * as React from "react";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@repo/ui/lib/utils";

/**
 * VolumeSlider
 *
 * @description
 * Controls sound volume & doesn't have a thumb, and the only thing
 * that is visible is the track and the range.
 */
const VolumeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "group relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <div className="relative flex h-4 w-full items-center">
      <SliderPrimitive.Track className="absolute h-2 w-full grow transform cursor-pointer overflow-hidden rounded-full bg-muted-foreground/50 transition-all duration-300 ease-in group-hover:h-4">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
    </div>
  </SliderPrimitive.Root>
));

VolumeSlider.displayName = SliderPrimitive.Root.displayName;

export { VolumeSlider };
