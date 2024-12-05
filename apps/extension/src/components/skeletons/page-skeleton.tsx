import { Spinner } from "@repo/ui/components/ui/spinner";

export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-y-3">
      <Spinner />
      {children}
    </div>
  );
}
