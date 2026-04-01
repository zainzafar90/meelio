import { useState } from "react";
import { ChevronDown, ChevronRight, Ban, Plus } from "lucide-react";
import { SiteItem } from "./site-item";
import {
  SITE_CATEGORY_LABEL_KEYS,
  SITE_LIST,
  SITE_CATEGORIES,
} from "../data/site-list";
import { cn } from "@repo/ui/lib/utils";
import { useTranslation } from "../../../../i18n";

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
  showHeading?: boolean;
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
  showHeading = true,
}: SiteListProps) {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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
    <div className="space-y-3">
      {showHeading ? (
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white">
            {t("site-blocker.drawer.presets.heading")}
          </h2>
          <p className="text-sm text-white/50">
            {t("site-blocker.drawer.presets.copy")}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        {SITE_CATEGORIES.filter((cat) => cat.isBlocked).map((category) => (
          <div
            key={category.key}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <div className="flex w-full items-center justify-between px-4 py-3">
              <button
                onClick={() => toggleCategory(category.key)}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <span className="text-lg">{category.icon}</span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-white/90">
                    {t(
                      SITE_CATEGORY_LABEL_KEYS[category.key] ??
                        "site-blocker.title"
                    )}
                  </h3>
                  <p className="text-xs text-white/45">
                    {t("site-blocker.drawer.presets.groupBlocked", {
                      blocked: SITE_LIST[category.key]?.filter((site) =>
                        blockedSites.includes(site.url)
                      ).length,
                      total: SITE_LIST[category.key]?.length ?? 0,
                    })}
                  </p>
                </div>
                {expandedCategories.includes(category.key) ? (
                  <ChevronDown className="h-4 w-4 text-white/45" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/45" />
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroupBlock(category.key);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isGroupBlocked(category.key, blockedSites)
                    ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                    : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white"
                )}
              >
                {isGroupBlocked(category.key, blockedSites) ? (
                  <>
                    <Ban className="h-3.5 w-3.5" />
                    <span>{t("site-blocker.drawer.presets.unblockAll")}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t("site-blocker.drawer.presets.blockAll")}</span>
                  </>
                )}
              </button>
            </div>

            {expandedCategories.includes(category.key) && (
              <div className="border-t border-white/10 px-2 py-2">
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
