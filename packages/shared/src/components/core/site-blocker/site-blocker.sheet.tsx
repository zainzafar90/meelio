import { useState, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/components/ui/sheet";
import { useDockStore } from "../../../stores/dock.store";
import { Button } from "@repo/ui/components/ui/button";
import { useTranslation } from "react-i18next";
import { SiteList } from "./components/site-list";
import { CustomBlockedSites } from "./components/custom-sites";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { useShallow } from "zustand/shallow";
import { useSiteBlockerStore } from "../../../stores/site-blocker.store";
import { toast } from "sonner";

const isExtension =
  typeof chrome !== "undefined" && chrome.storage !== undefined;

export function SiteBlockerSheet() {
  const { t } = useTranslation();
  const { isSiteBlockerVisible, toggleSiteBlocker } = useDockStore(
    useShallow((state) => ({
      isSiteBlockerVisible: state.isSiteBlockerVisible,
      toggleSiteBlocker: state.toggleSiteBlocker,
    }))
  );

  return (
    <Sheet open={isSiteBlockerVisible} onOpenChange={toggleSiteBlocker}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl border-l border-white/10 bg-zinc-900 backdrop-blur-xl"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>{t("site-blocker.title")}</SheetTitle>
            <SheetDescription>{t("site-blocker.description")}</SheetDescription>
          </SheetHeader>
        </VisuallyHidden>

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            {t("site-blocker.title")}
          </h2>
        </div>

        {isExtension ? (
          <ExtensionSiteBlockerContent />
        ) : (
          <BrowserSiteBlockerContent />
        )}
      </SheetContent>
    </Sheet>
  );
}

const ExtensionSiteBlockerContent = () => {
  const { t } = useTranslation();
  const [siteInput, setSiteInput] = useState("");
  const { sites, addSite, toggleSite, removeSite, bulkAddSites, bulkRemoveSites, initializeStore } = useSiteBlockerStore(
    useShallow((state) => ({
      sites: state.sites,
      addSite: state.addSite,
      toggleSite: state.toggleSite,
      removeSite: state.removeSite,
      bulkAddSites: state.bulkAddSites,
      bulkRemoveSites: state.bulkRemoveSites,
      initializeStore: state.initializeStore,
    }))
  );

  // Ensure local DB is loaded and server sync runs if online
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const onBlockSites = useCallback(
    async (sites: string[]) => {
      await bulkAddSites(sites);
    },
    [bulkAddSites]
  );

  const onUnblockSites = useCallback(
    async (sites: string[]) => {
      await bulkRemoveSites(sites);
    },
    [bulkRemoveSites]
  );

  const addCustomSite = async () => {
    let site = siteInput.trim();
    if (!site) return;

    try {
      const url = new URL(site.includes("://") ? site : `https://${site}`);
      site = url.hostname.replace(/^www\./, "");
    } catch {
      const match = site.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      site = match ? match[1].replace(/^www\./, "") : "";
    }

    if (!site) {
      toast.error(t("site-blocker.invalid-url", "Invalid URL format"));
      return;
    }

    const existingSite = Object.values(sites).find(
      (s) => s.url.toLowerCase() === site.toLowerCase()
    );

    if (existingSite && existingSite.isBlocked) {
      toast.error(
        t("site-blocker.already-blocked", "Site is already blocked"),
        {
          description: site,
        }
      );
      return;
    }

    try {
      await addSite(site);
      setSiteInput("");
      toast.success(t("site-blocker.site-added", "Site blocked successfully"), {
        description: site,
      });
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(t("site-blocker.already-exists", "Site already exists"), {
          description: site,
        });
      } else {
        toast.error(t("site-blocker.add-failed", "Failed to add site"), {
          description: error.message || "Please try again",
        });
      }
    }
  };

  const blockedSiteUrls = Object.values(sites)
    .filter((site) => site.isBlocked)
    .map((site) => site.url);

  return (
    <>
      <div className="flex items-center gap-2 border-b border-white/10 p-4">
        <input
          type="text"
          value={siteInput}
          onChange={(e) => setSiteInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addCustomSite();
            }
          }}
          placeholder={t(
            "site-blocker.input-placeholder",
            "Enter custom site URL (e.g., example.com)"
          )}
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2"
        />
        <Button onClick={addCustomSite} variant="outline">
          {t("site-blocker.add-button", "Add")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="space-y-8">
          <CustomBlockedSites
            sites={sites}
            onToggleSite={toggleSite}
          />
          <SiteList
            blockedSites={blockedSiteUrls}
            onToggleSite={toggleSite}
            onBlockSites={onBlockSites}
            onUnblockSites={onUnblockSites}
          />
        </div>
      </div>
    </>
  );
};

const BrowserSiteBlockerContent = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-lg text-white">
        {t(
          "site-blocker.extension-only",
          "Site blocking functionality is only available in the browser extension."
        )}
      </div>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() =>
          window.open(
            "https://chromewebstore.google.com/detail/meelio/cjcgnlglboofgepielbmjcepcdohipaj",
            "_blank"
          )
        }
      >
        {t("site-blocker.get-extension")}
      </Button>
    </div>
  );
};
