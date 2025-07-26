import type { PlasmoCSConfig } from "plasmo";
import React from "react";
import cssText from "data-text:./features/content/blocker.module.css";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { Blocker } from "./features/content/blocker";
import { getCustomBlockerMessage } from "./utils/blocker.utils";
import { pauseAllVideos, startAutoPause } from "./utils/media.utils";

interface SiteBlockState {
  id: string;
  url: string;
  isBlocked: boolean;
  blocked?: boolean; // @deprecated Use isBlocked instead
  streak: number;
  createdAt: number;
}

type SiteBlockMap = Record<string, SiteBlockState>;

function normalizeUrl(url: string): string {
  try {
    const normalized = new URL(url.includes("://") ? url : `https://${url}`);
    return normalized.hostname.replace(/^www\./, "");
  } catch {
    const match = url.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].replace(/^www\./, "") : url;
  }
}

function doesHostMatch(host: string, site: string): boolean {
  const normalizedHost = normalizeUrl(host);
  const normalizedSite = normalizeUrl(site);
  return normalizedHost === normalizedSite || normalizedHost.endsWith(`.${normalizedSite}`);
}

export const config: PlasmoCSConfig = {
  run_at: "document_start",
};

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const getCurrentSite = () => {
  return window.location.hostname;
};

const getMatchingSite = (sites: SiteBlockMap): SiteBlockState | undefined => {
  const host = getCurrentSite();
  return Object.values(sites).find(
    (site) => {
      // Use isBlocked if defined, otherwise fall back to blocked
      const isBlocked = site.isBlocked !== undefined ? site.isBlocked : site.blocked;
      return isBlocked && doesHostMatch(host, site.url);
    }
  );
};

const PlasmoOverlay = () => {
  const currentSite = getCurrentSite();
  const [storageData, setStorageData] = useStorage<{ state: { sites: SiteBlockMap } }>(
    {
      key: "meelio:local:site-blocker",
      instance: new Storage({
        area: "local",
      }),
    },
    { state: { sites: {} } }
  );

  const sites = storageData?.state?.sites || {};
  const message = getCustomBlockerMessage();
  const matchingSite = getMatchingSite(sites);
  const isBlocked = Boolean(matchingSite);

  React.useEffect(() => {
    if (isBlocked) {
      pauseAllVideos();
      startAutoPause();
      window.addEventListener('yt-navigate-finish', pauseAllVideos); 

      document.addEventListener('play', e => {
          (e.target as HTMLVideoElement|HTMLAudioElement).pause();
      }, true);

      if (matchingSite) {
        setStorageData({
          state: {
            sites: {
              ...sites,
              [matchingSite.id]: {
                ...matchingSite,
                streak: (matchingSite.streak ?? 0) + 1,
              },
            },
          },
        });
      }
    }
  }, [isBlocked]);

  const openAnyway = () => {
    if (!matchingSite) return;
    setStorageData({
      state: {
        sites: {
          ...sites,
          [matchingSite.id]: {
            ...matchingSite,
            isBlocked: false,
            blocked: false, // Keep for backward compatibility
            streak: 0,
          },
        },
      },
    });
  };

  if (!isBlocked) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 1)',
        backdropFilter: 'blur(10px)',
        zIndex: 2147483647,
        display: 'flex',
        height: '100vh',
        width: '100vw',
        flex: 1,
      }}
    >
      <Blocker
        message={message}
        siteName={currentSite}
        streak={matchingSite?.streak ?? 0}
        onOpenAnyway={() => openAnyway()}
      />
    </div>
  );
};

export default PlasmoOverlay;
