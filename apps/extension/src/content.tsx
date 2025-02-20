import type { PlasmoCSConfig } from "plasmo";
import React from "react";
import cssText from "data-text:./features/content/blocker.module.css"

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { Blocker } from "./features/content/blocker";
import { getCustomBlockerMessage } from "./utils/blocker.utils";
import { pauseAllVideos } from "./utils/video.utils";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
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

const isBlockedSite = (blockedSites: string[]) => {
  const currentSite = getCurrentSite();
  return blockedSites.some((site) => currentSite.includes(site));
};

const PlasmoOverlay = () => {
  const currentSite = getCurrentSite();
  const [blockedSites, setBlockedSites] = useStorage<string[]>(
    {
      key: "blockedSites",
      instance: new Storage({
        area: "local",
      }),
    },
    []
  );

  const message = getCustomBlockerMessage();
  const isBlocked = isBlockedSite(blockedSites);

  React.useEffect(() => {
    if (isBlocked) {
      pauseAllVideos();
    }
  }, [isBlocked]);

  const openAnyway = () => {
    const currentSite = getCurrentSite();
    const blockedSite = blockedSites.find((site) => currentSite.includes(site));
    if (blockedSite) {
      setBlockedSites(blockedSites.filter((site) => site !== blockedSite));
    }
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
        onOpenAnyway={() => openAnyway()}
      />
    </div>
  );
};

export default PlasmoOverlay;
