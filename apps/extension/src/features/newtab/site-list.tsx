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
    <div className="mx-auto">
      <h2 className="mb-6 text-2xl font-bold">Blocked Sites</h2>

      <div className="space-y-2">
        {SITE_CATEGORIES.map((category) => (
          <div
            key={category.key}
            className="flex flex-col space-y-4 rounded-lg bg-white/5 p-4"
          >
            <button
              onClick={() => toggleCategory(category.key)}
              className="flex w-full cursor-pointer items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-md">{category.icon}</span>
                <h3 className="text-md font-semibold">{category.name}</h3>
              </div>
              {expandedCategories.includes(category.key) ? (
                <ChevronDown className="transition-transform h-5 w-5 rotate-180" />
              ) : (
                <ChevronRight className="transition-transform h-5 w-5 rotate-0" />
              )}
            </button>

            {expandedCategories.includes(category.key) && (
              <div className="md:grid-cols-2 lg:grid-cols-3 grid grid-cols-1 gap-4">
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
