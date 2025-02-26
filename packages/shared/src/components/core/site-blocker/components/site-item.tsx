import { Ban, Plus } from "lucide-react";

import type { Site } from "../data/site-list";
import { FallbackSiteIcon } from "./fallback-site-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
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
  const getBackgroundColor = (hex: string) => {
    if (isBlocked) return "#ff000010";
    if (disabled) return "#00000020";
    return `#${hex}AA`;
  };

  const getTextColor = () => {
    if (disabled && !isBlocked) return "#ffffff40";
    return isBlocked ? "#ffffff66" : "#ffffff";
  };

  const getIconColor = () => {
    if (disabled && !isBlocked) return "#ffffff40";
    return isBlocked ? "#ffffff66" : "#fff";
  };

  const buttonContent = (
    <button
      onClick={() => !disabled && onToggle(site.url)}
      className={cn(
        "group flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 transition-colors",
        {
          "hover:bg-white/[0.075]": !disabled || isBlocked,
          "cursor-not-allowed opacity-60": disabled && !isBlocked,
        }
      )}
      style={{
        backgroundColor: getBackgroundColor(site.icon?.hex || "#000"),
      }}
      disabled={disabled && !isBlocked}
    >
      <div className="flex items-center gap-2">
        <div className="flex scale-75 transform items-center justify-center rounded">
          {site.icon ? (
            <svg className="size-6">
              <path d={site.icon.path} fill={getIconColor()} />
            </svg>
          ) : (
            <FallbackSiteIcon url={site.url} />
          )}
        </div>
        <span
          className={`text-sm font-medium`}
          style={{ color: getTextColor() }}
        >
          {site.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/60">{site.url}</span>
        {isBlocked ? (
          <Ban className="h-4 w-4 text-red-500" />
        ) : (
          <Plus
            className={`h-4 w-4 ${disabled ? "text-white/30" : "text-white/60"}`}
          />
        )}
      </div>
    </button>
  );

  if (disabled && !isBlocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent>
          <p>
            You've reached the maximum number of sites that can be blocked with
            a free account. Upgrade to Pro to block more sites.
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
}
