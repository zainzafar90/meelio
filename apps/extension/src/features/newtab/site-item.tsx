import React, { useEffect, useState } from "react";
import { Ban, Plus } from "lucide-react";

import { Site } from "@/config/site-list";
import { getFaviconUrl } from "@/utils/domain.utils";

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
            <FallbackIcon url={site.url} />
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

const FallbackIcon = ({ url, size = 32 }: { url: string; size?: number }) => {
  const [iconSrc, setIconSrc] = useState("");
  const [hasError, setHasError] = useState(false);
  const BLANK = "blank";

  const loadFavicon = async (url: string) => {
    const img = new Image(size, size);
    img.onload = () => setIconSrc(url);
    img.onerror = () => setIconSrc(BLANK); // Final fallback to placeholder blank icon
    img.src = url;
  };

  useEffect(() => {
    if (hasError) {
      const faviconUrl = getFaviconUrl(url);
      loadFavicon(faviconUrl);
    }
  }, [hasError, url]);

  return (
    <div className="inline-flex items-center justify-center">
      {iconSrc === BLANK ? (
        <div className="meelio-size-6 meelio-rounded meelio-bg-white/10" />
      ) : (
        <img
          src={iconSrc}
          width={size}
          height={size}
          alt={`Icon for ${url}`}
          className="meelio-flex meelio-size-6 meelio-items-center meelio-justify-center meelio-rounded"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};
