import { cn } from "@repo/ui/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-foreground/50", className)}
      {...props}
    />
  );
}

export { Skeleton };
