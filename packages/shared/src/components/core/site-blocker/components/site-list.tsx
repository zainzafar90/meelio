import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SiteItem } from "./site-item";
import { SITE_LIST, SITE_CATEGORIES } from "../data/site-list";

export interface Site {
  id: string;
  name: string;
  url: string;
  icon?: {
    path: string;
    hex: string;
  };
}

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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Popular Sites</h2>

      <div className="space-y-2">
        {SITE_CATEGORIES.filter((cat) => cat.enabled).map((category) => (
          <div
            key={category.key}
            className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/[0.075]"
          >
            <button
              onClick={() => toggleCategory(category.key)}
              className="flex w-full cursor-pointer items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{category.icon}</span>
                <h3 className="text-sm font-medium text-white/90">
                  {category.name}
                </h3>
              </div>
              {expandedCategories.includes(category.key) ? (
                <ChevronDown className="h-4 w-4 text-white/60" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white/60" />
              )}
            </button>

            {expandedCategories.includes(category.key) && (
              <div className="mt-4 space-y-2">
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
