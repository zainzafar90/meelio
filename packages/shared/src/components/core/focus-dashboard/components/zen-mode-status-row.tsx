import type { ReactNode } from "react";

import { cn } from "../../../../lib";
import type { ZenModeStatusTone } from "../focus-dashboard.helpers";

export interface ZenModeStatusItem {
  icon?: ReactNode;
  label: string;
  value: string;
  tone: ZenModeStatusTone;
  onClick?: () => void;
}

const toneClasses: Record<ZenModeStatusTone, string> = {
  ready: "bg-white/10 text-white/88",
  active: "bg-emerald-300/14 text-white",
  off: "bg-white/6 text-white/56",
  warning: "bg-amber-300/14 text-white",
  unavailable: "bg-white/6 text-white/64",
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
          "inline-flex min-w-[140px] max-w-full items-center gap-2 rounded-full px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl",
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

export const ZenModeStatusSummary = ({
  items,
  className,
}: {
  items: ZenModeStatusItem[];
  className?: string;
}) => {
  const activeItems = items.filter((item) => item.tone !== "off");
  if (activeItems.length === 0) return null;

  return (
    <p
      className={cn(
        "text-center text-xs text-white/40 transition-opacity duration-300 hover:text-white/70",
        className,
      )}
    >
      {activeItems.map((item, index) => (
        <span key={`${item.label}-summary`}>
          {index > 0 && <span className="mx-1.5">&middot;</span>}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-white/90"
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1">
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </span>
          )}
        </span>
      ))}
    </p>
  );
};

const toneAccentClasses: Record<ZenModeStatusTone, string> = {
  ready: "text-white/80",
  active: "text-emerald-100",
  off: "text-white/50",
  warning: "text-amber-100",
  unavailable: "text-white/60",
};

export const ZenModeStatusLine = ({
  items,
  className,
}: {
  items: ZenModeStatusItem[];
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-white/70 sm:text-xs",
      className,
    )}
  >
    {items.map((item, index) => (
      <span
        key={`${item.label}-${item.value}-line`}
        className="inline-flex min-w-0 items-center gap-1.5"
      >
        {item.icon && (
          <span className={cn("shrink-0", toneAccentClasses[item.tone])}>
            {item.icon}
          </span>
        )}
        <span className="uppercase tracking-[0.22em] text-white/42">
          {item.label}
        </span>
        <span className={cn("truncate font-medium", toneAccentClasses[item.tone])}>
          {item.value}
        </span>
        {index < items.length - 1 && <span className="ml-1 text-white/18">·</span>}
      </span>
    ))}
  </div>
);
