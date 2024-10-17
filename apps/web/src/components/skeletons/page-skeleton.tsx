import { Spinner } from "@/components/ui/spinner";

export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-y-3 items-center justify-center min-h-screen">
      <Spinner />
      {children}
    </div>
  );
}
