import { cn } from "@/lib/utils";

export const RipplesEffect = ({ size }: { size: "sm" | "md" | "lg" }) => {
  return (
    <div
      className={cn(
        "w-64 h-64 absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-visible",
        {
          "scale-50": size === "sm",
          "scale-90": size === "md",
          "scale-100": size === "lg",
        }
      )}
    >
      <div
        className="w-36 h-36 animate-concentric-ripple block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#86AFFF]/20 dark:border-[#86AFFF]/20"
        style={{ "--delay": "0.1s" } as React.CSSProperties}
      />
      <div
        className="w-48 h-48 animate-concentric-ripple block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#86AFFF]/20 dark:border-[#86AFFF]/20"
        style={{ "--delay": "0.4s" } as React.CSSProperties}
      />
      <div
        className="w-64 h-64 animate-concentric-ripple block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#86AFFF]/20 dark:border-[#86AFFF]/20"
        style={{ "--delay": "0.8s" } as React.CSSProperties}
      />
    </div>
  );
};
