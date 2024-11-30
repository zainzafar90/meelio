import { Site } from "@/config/site-categories";
import { Ban, Plus } from "lucide-react";
import React from "react";

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
      className={`meelio-flex meelio-w-full meelio-items-center meelio-justify-between meelio-rounded meelio-border meelio-border-white/10 meelio-p-3 meelio-transition-colors hover:meelio-border-white/50`}
      style={{
        backgroundColor: getBackgroundColor(site.icon?.hex || "#000"),
      }}
    >
      <div className="meelio-flex meelio-items-center meelio-gap-2">
        <div className="meelio-flex meelio-scale-75 meelio-transform meelio-items-center meelio-justify-center meelio-rounded">
          {site.icon ? (
            <svg className="meelio-size-6">
              <path d={site.icon.path} fill={getIconColor()} />
            </svg>
          ) : (
            <FallbackIcon />
          )}
        </div>
        <span
          className="text-white/90 font-medium meelio-flex meelio-items-center"
          style={{ color: getTextColor() }}
        >
          {site.name}
        </span>
      </div>
      <div className="meelio-flex meelio-items-center meelio-gap-2">
        <span className="text-white/80 meelio-text-sm">{site.url}</span>
        <span className="text-white/90 meelio-text-sm">
          {isBlocked ? (
            <Ban className="meelio-size-4 meelio-text-red-500" />
          ) : (
            <Plus className="meelio-size-4" />
          )}
        </span>
      </div>
    </button>
  );
}

const getFaviconUrl = (url: string) => {
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${url}&size=32`;
};

const FallbackIcon = () => {
  return (
    <img
      src={getFaviconUrl("https://google.com")}
      className="meelio-flex meelio-size-6 meelio-items-center meelio-justify-center meelio-rounded"
    />
  );
};
