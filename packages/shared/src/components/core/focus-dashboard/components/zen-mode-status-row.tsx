import type { ReactNode } from "react";

import { cn } from "../../../../lib";
import type { ZenModeStatusTone } from "../focus-dashboard.helpers";

export interface ZenModeStatusItem {
  icon?: ReactNode;
  label: string;
  value: string;
  tone: ZenModeStatusTone;
}

const toneClasses: Record<ZenModeStatusTone, string> = {
  ready: "border-white/12 bg-white/10 text-white/88",
  active: "border-emerald-200/18 bg-emerald-300/14 text-white",
  off: "border-white/10 bg-white/6 text-white/56",
  warning: "border-amber-200/20 bg-amber-300/14 text-white",
  unavailable: "border-white/10 bg-white/6 text-white/64",
};

export const ZenModeStatusRow = ({
  items,
  className,
}: {
  items: ZenModeStatusItem[];
  className?: string;
}) => (
  <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
    {items.map((item) => (
      <div
        key={`${item.label}-${item.value}`}
        className={cn(
          "inline-flex min-w-[140px] max-w-full items-center gap-2 rounded-full border px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl",
          toneClasses[item.tone]
        )}
      >
        {item.icon && <span className="shrink-0 text-white/80">{item.icon}</span>}
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-[0.24em] text-white/56">
            {item.label}
          </span>
          <span className="block truncate text-sm font-medium text-white">
            {item.value}
          </span>
        </span>
      </div>
    ))}
  </div>
);
