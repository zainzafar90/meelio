import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { SITE_CATEGORIES, SITE_LIST } from "@/config/site-list";
import { SiteItem } from "./site-item";
interface SiteListProps {
  blockedSites: string[];
  onToggleSite: (site: string) => void;
}

export function SiteList({ blockedSites, onToggleSite }: SiteListProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((key) => key !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  return (
    <div className="meelio-mx-auto">
      <h2 className="meelio-mb-6 meelio-text-2xl meelio-font-bold">
        Blocked Sites
      </h2>

      <div className="meelio-space-y-2">
        {SITE_CATEGORIES.map((category) => (
          <div
            key={category.key}
            className="meelio-flex meelio-flex-col meelio-space-y-4 meelio-rounded-lg meelio-bg-white/5 meelio-p-4"
          >
            <button
              onClick={() => toggleCategory(category.key)}
              className="meelio-flex meelio-w-full meelio-cursor-pointer meelio-items-center meelio-justify-between"
            >
              <div className="meelio-flex meelio-items-center meelio-gap-2">
                <span className="meelio-text-md">{category.icon}</span>
                <h3 className="meelio-text-md meelio-font-semibold">
                  {category.name}
                </h3>
              </div>
              {expandedCategories.includes(category.key) ? (
                <ChevronDown className="transition-transform meelio-h-5 meelio-w-5 meelio-rotate-180" />
              ) : (
                <ChevronRight className="transition-transform meelio-h-5 meelio-w-5 meelio-rotate-0" />
              )}
            </button>

            {expandedCategories.includes(category.key) && (
              <div className="meelio-md:grid-cols-2 meelio-lg:grid-cols-3 meelio-grid meelio-grid-cols-1 meelio-gap-4">
                {SITE_LIST[category.key]?.map((site) => (
                  <SiteItem
                    key={site.id}
                    site={site}
                    isBlocked={blockedSites.includes(site.url)}
                    onToggle={onToggleSite}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
