import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { doesSiteHostMatch } from "@/utils/site-blocker.utils";
import { useChromeStorageLocal } from "../hooks/use-chrome-storage-local";
import { Blocker } from "../features/content/blocker";
import { getCustomBlockerMessage } from "../utils/blocker.utils";
import { pauseAllVideos, startAutoPause } from "../utils/media.utils";

interface SiteBlockState {
  id: string;
  url: string;
  isBlocked: boolean;
  streak: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

type SiteBlockMap = Record<string, SiteBlockState>;

const getCurrentSite = () => window.location.hostname;

const getMatchingSite = (sites: SiteBlockMap): SiteBlockState | undefined => {
  const host = getCurrentSite();
  return Object.values(sites).find(
    (site) => site.isBlocked && doesSiteHostMatch(host, site.url)
  );
};

const BlockerOverlay = () => {
  const currentSite = getCurrentSite();
  const [storageData, setStorageData] = useChromeStorageLocal<{
    state: { sites: SiteBlockMap };
  }>("meelio:local:site-blocker", { state: { sites: {} } });

  const sites = storageData?.state?.sites ?? {};
  const message = getCustomBlockerMessage();
  const matchingSite = getMatchingSite(sites);
  const isBlocked = Boolean(matchingSite);

  useEffect(() => {
    if (!isBlocked) return;

    pauseAllVideos();
    startAutoPause();
    window.addEventListener("yt-navigate-finish", pauseAllVideos);

    document.addEventListener(
      "play",
      (e) => {
        (e.target as HTMLVideoElement | HTMLAudioElement).pause();
      },
      true
    );

    if (matchingSite) {
      void setStorageData({
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
  }, [isBlocked]);

  const openAnyway = async () => {
    if (!matchingSite) return;
    await setStorageData({
      state: {
        sites: {
          ...sites,
          [matchingSite.id]: {
            ...matchingSite,
            isBlocked: false,
            streak: 0,
            updatedAt: Date.now(),
          },
        },
      },
    });
  };

  if (!isBlocked) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 1)",
        backdropFilter: "blur(10px)",
        zIndex: 2147483647,
        display: "flex",
        height: "100vh",
        width: "100vw",
        flex: 1,
      }}
    >
      <Blocker
        message={message}
        siteName={currentSite}
        streak={matchingSite?.streak ?? 0}
        onOpenAnyway={openAnyway}
      />
    </div>
  );
};

const isCurrentSiteBlocked = async (): Promise<boolean> => {
  const result = await chrome.storage.local.get("meelio:local:site-blocker");
  const raw = result["meelio:local:site-blocker"];
  if (!raw) return false;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const sites = parsed?.state?.sites ?? {};
  return Boolean(getMatchingSite(sites));
};

// eslint-disable-next-line react-refresh/only-export-components
export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",
  cssInjectionMode: "ui",
  async main(ctx) {
    if (!(await isCurrentSiteBlocked())) return;

    const ui = await createShadowRootUi(ctx, {
      name: "meelio-site-blocker",
      position: "modal",
      zIndex: 2147483646,
      onMount: (uiContainer) => {
        const root = createRoot(uiContainer);
        root.render(<BlockerOverlay />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    ui.mount();
  },
});
