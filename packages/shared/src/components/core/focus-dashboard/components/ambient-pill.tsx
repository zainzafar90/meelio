import type { ReactNode } from "react";

import { cn } from "../../../../lib";

interface AmbientPillProps {
  icon?: ReactNode;
  label: string;
  value: string;
  className?: string;
  endAdornment?: ReactNode;
}

export const AmbientPill = ({
  icon,
  label,
  value,
  className,
  endAdornment,
}: AmbientPillProps) => (
  <div
    className={cn(
      "inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-sm text-white/92 shadow-[0_8px_22px_rgba(0,0,0,0.09)] backdrop-blur-2xl sm:h-10 sm:gap-3 sm:px-5",
      className,
    )}
  >
    {icon && <span className="text-white/72">{icon}</span>}
    <span className="hidden text-[11px] font-medium uppercase tracking-[0.28em] text-white/52 md:inline">
      {label}
    </span>
    <span className="max-w-[86px] truncate text-xs font-medium text-white/90 [text-shadow:_0_1px_8px_rgba(0,0,0,0.14)] sm:max-w-[132px] sm:text-sm">
      {value}
    </span>
    {endAdornment ? <span className="shrink-0 text-white/42">{endAdornment}</span> : null}
  </div>
);
