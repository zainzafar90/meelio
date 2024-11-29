import React from "react";
import { SITE_CATEGORIES, SITE_LIST } from "../../config/site-categories";

interface SiteListProps {
  blockedSites: string[];
  onToggleSite: (site: string) => void;
}

export function SiteList({ blockedSites, onToggleSite }: SiteListProps) {
  return (
    <div className="meelio-mx-auto meelio-max-w-4xl meelio-p-4">
      <h2 className="meelio-mb-6 meelio-text-2xl meelio-font-bold">
        Blocked Sites
      </h2>

      <div className="meelio-space-y-8">
        {SITE_CATEGORIES.map((category) => (
          <div
            key={category.key}
            className="meelio-rounded-lg meelio-bg-white/5 meelio-p-4"
          >
            <div className="meelio-mb-4 meelio-flex meelio-items-center meelio-gap-2">
              <span className="meelio-text-2xl">{category.icon}</span>
              <h3 className="meelio-text-xl meelio-font-semibold">
                {category.name}
              </h3>
            </div>

            <div className="meelio-md:grid-cols-2 meelio-lg:grid-cols-3 meelio-grid meelio-grid-cols-1 meelio-gap-4">
              {SITE_LIST[category.key]?.map((site) => {
                const isBlocked = blockedSites.includes(site.url);
                return (
                  <button
                    key={site.url}
                    onClick={() => onToggleSite(site.url)}
                    className={`meelio-flex meelio-w-full meelio-items-center meelio-justify-between meelio-rounded meelio-p-3 meelio-transition-colors ${
                      isBlocked
                        ? "meelio-bg-red-500/20 hover:meelio-bg-red-500/30"
                        : "meelio-bg-white/10 hover:meelio-bg-white/20"
                    }`}
                  >
                    <span>{site.name}</span>
                    <div className="meelio-flex meelio-items-center meelio-gap-2">
                      <span className="meelio-text-sm meelio-text-gray-400">
                        {site.url}
                      </span>
                      <span className="meelio-text-sm">
                        {isBlocked ? "🚫" : "➕"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
