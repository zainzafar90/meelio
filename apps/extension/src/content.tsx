import type { PlasmoCSConfig } from "plasmo";
import React from "react";
import cssText from "data-text:./features/content/blocker.module.css"

import { useSiteBlockerStore } from "@repo/shared";

import { Blocker } from "./features/content/blocker";
import { getCustomBlockerMessage } from "./utils/blocker.utils";
import { startAutoPause } from "./utils/video.utils";

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

const isBlockedSite = (blockedSites: string[]) => {
  const currentSite = getCurrentSite();
  return blockedSites.some((site) => currentSite.includes(site));
};

const PlasmoOverlay = () => {
  const currentSite = getCurrentSite();
  const blockedSites = useSiteBlockerStore((s) => s.blockedSites);
  const removeSite = useSiteBlockerStore((s) => s.removeSite);

  const message = getCustomBlockerMessage();
  const isBlocked = isBlockedSite(blockedSites);

  React.useEffect(() => {
    if (!isBlocked) return
    const stop = startAutoPause()
    return () => {
      stop()
    }
  }, [isBlocked])

  const openAnyway = () => {
    const currentSite = getCurrentSite();
    const blockedSite = blockedSites.find((site) => currentSite.includes(site));
    if (blockedSite) {
      // Temporarily unblock the site without removing it from the user's
      // account so that "open anyway" only affects the current device.
      removeSite(blockedSite, false);
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
