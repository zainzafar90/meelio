import * as React from "react";

import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

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
      "relative group flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <div className="relative h-4 w-full flex items-center">
      <SliderPrimitive.Track className="absolute h-2 w-full cursor-pointer grow overflow-hidden rounded-full bg-muted-foreground/50 transform group-hover:h-4 transition-all ease-in duration-300">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
    </div>
  </SliderPrimitive.Root>
));

VolumeSlider.displayName = SliderPrimitive.Root.displayName;

export { VolumeSlider };
