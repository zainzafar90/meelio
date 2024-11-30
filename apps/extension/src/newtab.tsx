import React from "react";
import { useState } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { SiteList } from "./features/newtab/site-list";

import { SITE_LIST } from "./config/site-categories";

import "@/style.css";
import { SiteItem } from "./features/newtab/site-item";

export default function NewTab() {
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
    <div className="meelio-min-h-screen meelio-bg-gray-900 meelio-text-white">
      <main className="meelio-mx-auto meelio-max-w-md meelio-py-8">
        <div className="meelio-p-4 meelio-font-sans">
          <h3 className="meelio-mb-4 meelio-text-xl">Add Custom Site</h3>
          <div className="meelio-mb-4 meelio-flex meelio-gap-2">
            <input
              type="text"
              value={siteInput}
              onChange={(e) => setSiteInput(e.target.value)}
              placeholder="Enter custom site URL (e.g., example.com)"
              className="meelio-flex-1 meelio-rounded meelio-border meelio-border-white/10 meelio-bg-white/5 meelio-p-2"
            />
            <button
              onClick={addCustomSite}
              className="meelio-rounded meelio-bg-blue-500 meelio-px-4 meelio-py-2 meelio-text-white hover:meelio-bg-blue-600"
            >
              Add Custom Site
            </button>
          </div>

          <CustomBlockedSites
            blockedSites={blockedSites}
            onToggleSite={toggleSite}
          />

          <SiteList blockedSites={blockedSites} onToggleSite={toggleSite} />
        </div>
      </main>
    </div>
  );
}

const CustomBlockedSites = ({
  blockedSites,
  onToggleSite,
}: {
  blockedSites: string[];
  onToggleSite: (site: string) => void;
}) => {
  const customBlockedSites = blockedSites.filter(
    (site) =>
      !Object.values(SITE_LIST)
        .flat()
        .some((s) => s.url === site)
  );

  if (customBlockedSites.length === 0) return null;
  return (
    <div className="meelio-my-8">
      <h2 className="meelio-mb-6 meelio-text-2xl meelio-font-bold">
        Custom Blocked Sites
      </h2>
      <ul className="meelio-space-y-2">
        {customBlockedSites.map((site) => (
          <SiteItem
            site={{
              id: site,
              name: site,
              url: site,
            }}
            isBlocked={true}
            onToggle={onToggleSite}
          />
        ))}
      </ul>
    </div>
  );
};
