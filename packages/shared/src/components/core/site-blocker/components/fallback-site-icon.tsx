import { useEffect } from "react";

import { useState } from "react";

import { getFaviconUrl } from "../utils/domain.utils";

export const FallbackSiteIcon = ({
  url,
  size = 32,
}: {
  url: string;
  size?: number;
}) => {
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
