import { cn } from "@repo/ui/lib/utils";

export const AppLayout = (props: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "text-white",
        "relative h-screen overflow-hidden p-home",
        "flex min-h-screen flex-col",
        "transition-opacity duration-300 ease-out"
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute -left-[10%] -top-[25%] h-[65%] w-[55%] rounded-full bg-black blur-[120px]" />
        <div className="absolute -right-[10%] -top-[25%] h-[65%] w-[55%] rounded-full bg-black blur-[120px]" />
      </div>
      {props.children}
    </div>
  );
};
