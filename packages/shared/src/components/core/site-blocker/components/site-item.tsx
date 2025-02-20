import { Ban, Plus } from "lucide-react";

import type { Site } from "../data/site-list";
import { FallbackSiteIcon } from "./fallback-site-icon";

interface SiteItemProps {
  site: Site;
  isBlocked: boolean;
  onToggle: (site: string) => void;
}

export function SiteItem({ site, isBlocked, onToggle }: SiteItemProps) {
  const getBackgroundColor = (hex: string) => {
    if (isBlocked) return "#ff000010";

    return `#${hex}AA`;
  };

  const getTextColor = () => {
    return isBlocked ? "#ffffff66" : "#ffffff";
  };

  const getIconColor = () => {
    return isBlocked ? "#ffffff66" : "#fff";
  };

  return (
    <button
      onClick={() => onToggle(site.url)}
      className={`group flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/[0.075]`}
      style={{
        backgroundColor: getBackgroundColor(site.icon?.hex || "#000"),
      }}
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
          className={`text-sm font-medium ${
            isBlocked ? "text-white/60" : "text-white/90"
          }`}
        >
          {site.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/60">{site.url}</span>
        {isBlocked ? (
          <Ban className="h-4 w-4 text-red-500" />
        ) : (
          <Plus className="h-4 w-4 text-white/60" />
        )}
      </div>
    </button>
  );
}
