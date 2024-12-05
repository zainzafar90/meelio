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
      className={`flex w-full items-center justify-between rounded border border-white/10 p-2 transition-colors hover:border-white/50`}
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
            <FallbackIcon url={site.url} />
          )}
        </div>
        <span
          className="text-white/90 font-medium flex items-center"
          style={{ color: getTextColor() }}
        >
          {site.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white/80 text-sm">{site.url}</span>
        <span className="text-white/90 text-sm">
          {isBlocked ? (
            <Ban className="size-4 text-red-500" />
          ) : (
            <Plus className="size-4" />
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
        <div className="size-6 rounded bg-white/10" />
      ) : (
        <img
          src={iconSrc}
          width={size}
          height={size}
          alt={`Icon for ${url}`}
          className="flex size-6 items-center justify-center rounded"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};
