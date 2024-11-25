import { cn } from "@/lib/utils";

export const BackgroundOverlay = () => {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/5",
        "transition-transform duration-300 ease-out"
      )}
    />
  );
};
