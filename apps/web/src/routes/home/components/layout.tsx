import { cn } from "@/lib/utils";

export const AppLayout = (props: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "relative h-screen p-home",
        "grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto_1fr_auto]",
        "absolute inset-0 overflow-hidden",
        "transition-opacity duration-300 ease-out"
      )}
    >
      {props.children}
    </div>
  );
};
