import { Brain, CheckCircle2, ChevronDown, MinusCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";

import { cn } from "../../../../lib";
import { AmbientPill } from "./ambient-pill";
import type { ZenModeStatusItem } from "./zen-mode-status-row";
import { ZenModeConfigTrigger } from "./zen-mode-config-trigger";
import { ZenPrimaryAction } from "./zen-primary-action";

interface ZenLaunchRailProps {
  focusPillLabel: string;
  focusPillValue: string;
  startFocusingLabel: string;
  zenHeadline: string;
  zenSubtitle: string;
  zenStatusItems: ZenModeStatusItem[];
  configureLabel: string;
  onConfigure: () => void;
  onStartFocusing: () => void;
}

export const ZenLaunchRail = ({
  focusPillLabel,
  focusPillValue,
  startFocusingLabel,
  zenHeadline,
  zenSubtitle,
  zenStatusItems,
  configureLabel,
  onConfigure,
  onStartFocusing,
}: ZenLaunchRailProps) => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0"
          aria-label={`${focusPillLabel}: ${focusPillValue}`}
        >
          <AmbientPill
            icon={<Brain className="size-3.5" />}
            label={focusPillLabel}
            value={focusPillValue}
            className="cursor-pointer pr-2.5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-white/14 group-data-[state=open]:bg-white/15 group-data-[state=open]:shadow-[0_12px_28px_rgba(0,0,0,0.12)] sm:pr-3.5"
            endAdornment={
              <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            }
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={12}
        collisionPadding={16}
        className="w-[min(27rem,calc(100vw-2rem))] rounded-[28px] border-white/12 bg-[linear-gradient(180deg,rgba(35,35,42,0.82),rgba(17,17,20,0.88))] p-0 text-white shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-3xl"
      >
        <div className="space-y-4 p-4 sm:p-5">
          <div className="space-y-2 text-left">
            <span className="text-sm font-medium uppercase tracking-[0.24em] text-white/38">
              {focusPillLabel}
            </span>
            <h2 className="max-w-lg text-balance text-[1.65rem] font-semibold tracking-tight text-white/95 sm:text-[1.95rem]">
              {zenHeadline}
            </h2>
            <p className="max-w-lg text-base leading-7 text-white/56">
              {zenSubtitle}
            </p>
          </div>

          {zenStatusItems.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {zenStatusItems.map((item) => {
                const isIncluded = item.tone === "ready" || item.tone === "active";

                return (
                <span
                  key={`${item.label}-${item.value}-pill`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-2xl",
                    isIncluded
                      ? item.tone === "active"
                        ? "bg-emerald-300/10 text-emerald-50/92"
                        : "bg-white/7 text-white/80"
                      : "bg-white/[0.045] text-white/58",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0",
                      isIncluded ? "opacity-75" : "text-white/34",
                    )}
                  >
                    {isIncluded ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <MinusCircle className="size-4" />
                    )}
                  </span>
                  <span className={cn("font-medium", isIncluded ? "" : "text-white/46")}>
                    {item.label}
                  </span>
                  {!isIncluded ? (
                    <span className="font-medium text-white/66">{item.value}</span>
                  ) : null}
                </span>
                );
              })}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ZenPrimaryAction label={startFocusingLabel} onClick={onStartFocusing} />
            <ZenModeConfigTrigger label={configureLabel} onClick={onConfigure} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
);
