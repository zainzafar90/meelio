import { cn } from "@/lib/utils";

export const AppLayout = (props: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "relative h-screen p-home",
        "flex min-h-screen flex-col",
        "transition-opacity duration-300 ease-out"
      )}
    >
      {props.children}
    </div>
  );
};
