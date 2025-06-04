import { useState } from "react";
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
// @ts-ignore
import { Storage } from "@plasmohq/storage";
// @ts-ignore
import { useStorage } from "@plasmohq/storage/hook";
import { SiteList } from "./components/site-list";
import { CustomBlockedSites } from "./components/custom-sites";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { PremiumFeature } from "../../../components/common/premium-feature";
import { Icons } from "../../../components/icons";
import { useShallow } from "zustand/shallow";

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
          <PremiumFeature
            requirePro={true}
            fallback={
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 border border-white/10">
                    <Icons.proMember className="w-8 h-8 text-white/80" />
                  </div>
                  <div className="text-lg text-white font-medium mb-2">
                    {t(
                      "site-blocker.premium-feature-title",
                      "Premium Site Blocker"
                    )}
                  </div>
                  <div className="text-white/70 max-w-md mb-6">
                    {t("site-blocker.premium-feature")}
                  </div>

                  <div className="bg-zinc-800/50 p-4 rounded-lg border border-white/10 w-full max-w-md mb-6">
                    <div className="text-sm font-medium text-white mb-2">
                      Pro Feature
                    </div>
                    <div className="text-xs text-white/70">
                      Site blocking is available for Pro users
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  onClick={() => console.log("/settings/billing")}
                >
                  {t("site-blocker.upgrade")}
                </Button>
              </div>
            }
          >
            <ExtensionSiteBlockerContent />
          </PremiumFeature>
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
  const [blockedSites, setBlockedSites] = useStorage<string[]>(
    {
      key: "blockedSites",
      instance: new Storage({
        area: "local",
      }),
    },
    []
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

    if (!site) return;

    if (!blockedSites.includes(site)) {
      setBlockedSites([...blockedSites, site]);
      setSiteInput("");
    }
  };

  const toggleSite = (site: string) => {
    if (blockedSites.includes(site)) {
      setBlockedSites(blockedSites.filter((s) => s !== site));
    } else {
      setBlockedSites([...blockedSites, site]);
    }
  };

  const onBlockSites = (sites: string[]) => {
    setBlockedSites((prev) => [...new Set([...(prev || []), ...sites])]);
  };

  const onUnblockSites = (sites: string[]) => {
    setBlockedSites((prev) =>
      (prev || []).filter((site) => !sites.includes(site))
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 border-b border-white/10 p-4">
        <input
          type="text"
          value={siteInput}
          onChange={(e) => setSiteInput(e.target.value)}
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
            blockedSites={blockedSites}
            onToggleSite={toggleSite}
          />
          <SiteList
            blockedSites={blockedSites}
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
