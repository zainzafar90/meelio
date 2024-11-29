import React from "react";
import { useState } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { SiteList } from "./features/site-categories/site-list";

import "@/style.css";
import { SITE_LIST } from "./config/site-categories";

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
      <main className="meelio-container meelio-mx-auto meelio-py-8">
        <div className="meelio-p-4 meelio-font-sans">
          <div className="meelio-mt-8 meelio-border-t meelio-border-white/10 meelio-pt-8">
            <h3 className="meelio-mb-4 meelio-text-xl">Add Custom Site</h3>
            <div className="meelio-flex meelio-gap-2">
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
          </div>

          {blockedSites.length > 0 && (
            <div className="meelio-mt-8">
              <h3 className="meelio-mb-4 meelio-text-xl">
                Custom Blocked Sites
              </h3>
              <ul className="meelio-space-y-2">
                {blockedSites
                  .filter(
                    (site) =>
                      !Object.values(SITE_LIST)
                        .flat()
                        .some((s) => s.url === site)
                  )
                  .map((site) => (
                    <li
                      key={site}
                      className="meelio-flex meelio-items-center meelio-justify-between meelio-rounded meelio-bg-red-500/20 meelio-p-3"
                    >
                      <span>{site}</span>
                      <button
                        onClick={() => toggleSite(site)}
                        className="meelio-rounded meelio-bg-red-500 meelio-px-2 meelio-py-1 meelio-text-sm meelio-text-white hover:meelio-bg-red-600"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <SiteList blockedSites={blockedSites} onToggleSite={toggleSite} />
        </div>
      </main>
    </div>
  );
}
