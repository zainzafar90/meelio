import { useState } from "react";
import { Sheet, SheetContent } from "@repo/ui/components/ui/sheet";
import { useDockStore } from "../../../stores/dock.store";
import { Button } from "@repo/ui/components/ui/button";
import { useTranslation } from "react-i18next";
import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { SiteList } from "./components/site-list";
import { CustomBlockedSites } from "./components/custom-sites";

const isExtension =
  typeof chrome !== "undefined" && chrome.storage !== undefined;

export const SiteBlockerSheet = () => {
  const { t } = useTranslation();
  const { isSiteBlockerVisible, toggleSiteBlocker } = useDockStore((state) => ({
    isSiteBlockerVisible: state.isSiteBlockerVisible,
    toggleSiteBlocker: state.toggleSiteBlocker,
  }));

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
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {t("common.site-blocker", "Site Blocker")}
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
};

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
    const site = siteInput.trim();
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
          <SiteList blockedSites={blockedSites} onToggleSite={toggleSite} />
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
            "https://chrome.google.com/webstore/detail/your-extension-id",
            "_blank"
          )
        }
      >
        {t("site-blocker.get-extension", "Get the Extension")}
      </Button>
    </div>
  );
};
