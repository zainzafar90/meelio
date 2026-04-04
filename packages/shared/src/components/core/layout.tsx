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
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient
            id="center-vignette"
            cx="50%"
            cy="42%"
            r="35%"
            fx="48%"
            fy="40%"
          >
            <stop offset="0%" stopColor="black" stopOpacity="0.22" />
            <stop offset="55%" stopColor="black" stopOpacity="0.08" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="bottom-vignette"
            cx="50%"
            cy="93%"
            r="18%"
            fx="50%"
            fy="91%"
          >
            <stop offset="0%" stopColor="black" stopOpacity="0.14" />
            <stop offset="60%" stopColor="black" stopOpacity="0.04" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#center-vignette)" />
        <rect width="100%" height="100%" fill="url(#bottom-vignette)" />
      </svg>
      {props.children}
    </div>
  );
};
