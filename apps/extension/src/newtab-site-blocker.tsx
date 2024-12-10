import React from "react";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { SiteList } from "@/features/newtab/site-list";
import { SITE_LIST } from "@/config/site-list";
import { SiteItem } from "@/features/newtab/site-item";
import { add } from "@repo/core";

import "@/style.css";

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
    <div className="min-h-screen bg-gray-900 text-white">
      <div>{add(1, 2)}</div>
      <main className="mx-auto max-w-md py-8">
        <div className="p-4 font-sans">
          <h3 className="mb-4 text-xl">Add Custom Site</h3>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={siteInput}
              onChange={(e) => setSiteInput(e.target.value)}
              placeholder="Enter custom site URL (e.g., example.com)"
              className="flex-1 rounded border border-white/10 bg-white/5 p-2"
            />
            <button
              onClick={addCustomSite}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
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
    <div className="my-8">
      <h2 className="mb-6 text-2xl font-bold">Custom Blocked Sites</h2>
      <ul className="space-y-2">
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
