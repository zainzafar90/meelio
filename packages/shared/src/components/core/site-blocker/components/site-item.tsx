import { Ban, Plus } from "lucide-react";

import type { Site } from "../data/site-list";
import { FallbackSiteIcon } from "./fallback-site-icon";
import { cn } from "@repo/ui/lib/utils";

interface SiteItemProps {
  site: Site;
  isBlocked: boolean;
  onToggle: (site: string) => void;
  disabled?: boolean;
}

export function SiteItem({
  site,
  isBlocked,
  onToggle,
  disabled = false,
}: SiteItemProps) {
  const iconAccent = site.icon ? `#${site.icon.hex}` : "#71717a";

  return (
    <button
      onClick={() => !disabled && onToggle(site.url)}
      className={cn(
        "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors",
        {
          "hover:bg-white/[0.045]": !disabled || isBlocked,
          "cursor-not-allowed opacity-55": disabled && !isBlocked,
        }
      )}
      disabled={disabled && !isBlocked}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]",
            isBlocked && "border-rose-400/20 bg-rose-400/10"
          )}
          style={{
            boxShadow: isBlocked
              ? "none"
              : `inset 0 0 0 1px color-mix(in srgb, ${iconAccent} 20%, transparent)`,
          }}
        >
          {site.icon ? (
            <svg className="size-5">
              <path
                d={site.icon.path}
                fill={isBlocked ? "#ffe4e6" : iconAccent}
              />
            </svg>
          ) : (
            <FallbackSiteIcon url={site.url} />
          )}
        </div>

        <div className="min-w-0">
          <p
            className={cn("truncate text-sm font-medium", {
              "text-white/90": !isBlocked && !disabled,
              "text-rose-50": isBlocked,
              "text-white/45": disabled && !isBlocked,
            })}
          >
            {site.name}
          </p>
          <p className="truncate text-xs text-white/45">{site.url}</p>
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.01em]",
            {
              "border-rose-400/20 bg-rose-400/10 text-rose-100": isBlocked,
              "border-white/10 bg-white/[0.04] text-white/60 group-hover:text-white/80":
                !isBlocked && !disabled,
              "border-white/10 bg-white/[0.02] text-white/35":
                disabled && !isBlocked,
            }
          )}
        >
          {isBlocked ? (
            <>
              <Ban className="h-3.5 w-3.5" />
              Blocked
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Block
            </>
          )}
        </span>
      </div>
    </button>
  );
}
