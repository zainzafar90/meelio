import { useState } from "react";
import { ChevronDown, ChevronRight, Ban, Plus } from "lucide-react";
import { SiteItem } from "./site-item";
import { SITE_LIST, SITE_CATEGORIES } from "../data/site-list";
import { PremiumFeature } from "../../../../components/common/premium-feature";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { useAuthStore } from "../../../../stores/auth.store";
import { useShallow } from "zustand/shallow";

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
  onBlockSites: (sites: string[]) => void;
  onUnblockSites: (sites: string[]) => void;
}

const isGroupBlocked = (categoryKey: string, blockedSites: string[]) => {
  const groupSites = SITE_LIST[categoryKey] || [];
  return groupSites.every((site) => blockedSites.includes(site.url));
};

export function SiteList({
  blockedSites,
  onToggleSite,
  onBlockSites,
  onUnblockSites,
}: SiteListProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((key) => key !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const toggleGroupBlock = (categoryKey: string) => {
    const groupSites = SITE_LIST[categoryKey] || [];
    const isCurrentlyBlocked = isGroupBlocked(categoryKey, blockedSites);
    const urls = groupSites.map((site) => site.url);

    if (isCurrentlyBlocked) {
      onUnblockSites(urls);
    } else {
      onBlockSites(urls);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Popular Sites</h2>

      <div className="space-y-2">
        {SITE_CATEGORIES.filter((cat) => cat.isBlocked).map((category) => (
          <div
            key={category.key}
            className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/[0.075]"
          >
            <div className="flex w-full items-center justify-between">
              <button
                onClick={() => toggleCategory(category.key)}
                className="flex items-center gap-2"
              >
                <span className="text-xl">{category.icon}</span>
                <h3 className="text-sm font-medium text-white/90">
                  {category.name}
                </h3>
                {expandedCategories.includes(category.key) ? (
                  <ChevronDown className="h-4 w-4 text-white/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/60" />
                )}
              </button>

              {isGroupBlocked(category.key, blockedSites) ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroupBlock(category.key);
                  }}
                  className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/60 hover:bg-white/[0.075]"
                >
                  <Ban className="h-4 w-4 text-red-500" />
                  <span>Unblock All</span>
                </button>
              ) : (
                <PremiumFeature
                  requirePro={true}
                  fallback={
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/30 opacity-60 cursor-not-allowed"
                          disabled
                        >
                          <Plus className="h-4 w-4" />
                          <span>Block All</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Site blocking requires a Pro subscription.</p>
                      </TooltipContent>
                    </Tooltip>
                  }
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupBlock(category.key);
                    }}
                    className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/60 hover:bg-white/[0.075]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Block All</span>
                  </button>
                </PremiumFeature>
              )}
            </div>

            {expandedCategories.includes(category.key) && (
              <div className="mt-4 space-y-2">
                {SITE_LIST[category.key]?.map((site) => (
                  <SiteItem
                    key={site.id}
                    site={site}
                    isBlocked={blockedSites.includes(site.url)}
                    onToggle={(siteUrl) => {
                      onToggleSite(siteUrl);
                    }}
                    disabled={false}
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
