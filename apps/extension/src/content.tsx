import type { PlasmoCSConfig } from "plasmo";
import React from "react";
import cssText from "data-text:./features/content/blocker.module.css";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { Blocker } from "./features/content/blocker";
import { getCustomBlockerMessage } from "./utils/blocker.utils";
import { pauseAllVideos, startAutoPause } from "./utils/media.utils";

interface SiteBlockState {
  siteId: string;
  blocked?: boolean;
  streak: number;
}

type SiteBlockMap = Record<string, SiteBlockState>;


export const config: PlasmoCSConfig = {
  run_at: "document_start",
};

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const getCurrentSite = () => {
  return new URL(window.location.href).hostname;
};

const doesHostMatch = (host: string, site: string) => {
  return host === site || host.endsWith(`.${site}`);
};

const getMatchingSiteId = (sites: SiteBlockMap): string | undefined => {
  const host = getCurrentSite();
  return Object.keys(sites).find(
    (id) => sites[id].blocked && doesHostMatch(host, id)
  );
};

const PlasmoOverlay = () => {
  const currentSite = getCurrentSite();
  const [blockedSites, setBlockedSites] = useStorage<SiteBlockMap>(
    {
      key: "blockedSites",
      instance: new Storage({
        area: "local",
      }),
    },
    {}
  );

  const message = getCustomBlockerMessage();
  const matchingSiteId = getMatchingSiteId(blockedSites || {});
  const isBlocked = Boolean(matchingSiteId);

  React.useEffect(() => {
    if (isBlocked) {
      pauseAllVideos();
      startAutoPause();
      window.addEventListener('yt-navigate-finish', pauseAllVideos); 

      document.addEventListener('play', e => {
          (e.target as HTMLVideoElement|HTMLAudioElement).pause();
      }, true);


      if (matchingSiteId) {
        const entry = blockedSites[matchingSiteId];
        setBlockedSites({
          ...blockedSites,
          [matchingSiteId]: {
            ...entry,
            streak: (entry?.streak ?? 0) + 1,
          },
        });
      }
    }
  }, [isBlocked, matchingSiteId]);

  const openAnyway = () => {
    if (!matchingSiteId) return;
    const entry = blockedSites[matchingSiteId];
    setBlockedSites({
      ...blockedSites,
      [matchingSiteId]: {
        ...entry,
        blocked: false,
        streak: 0,
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
        streak={matchingSiteId ? blockedSites[matchingSiteId]?.streak ?? 0 : 0}
        onOpenAnyway={() => openAnyway()}
      />
    </div>
  );
};

export default PlasmoOverlay;
