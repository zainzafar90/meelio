import { SITE_LIST } from "../data/site-list";
import { SiteItem } from "./site-item";
import type { SiteBlocker } from "../../../../lib/db/models.dexie";

interface CustomSitesProps {
  sites: SiteBlocker[];
  onToggleSite: (site: string) => void;
}

export const CustomBlockedSites = ({
  sites,
  onToggleSite,
}: CustomSitesProps) => {
  const customSites = sites.filter(
    (site) =>
      !Object.values(SITE_LIST)
        .flat()
        .some((s) => s.url === site.url)
  );

  if (customSites.length === 0) return null;
  return (
    <div className="my-8">
      <h2 className="mb-6 text-2xl font-bold">Custom Sites</h2>
      <ul className="space-y-2">
        {customSites.map((site) => (
          <SiteItem
            key={site.id}
            site={{
              id: site.id,
              name: site.url,
              url: site.url,
            }}
            isBlocked={site.isBlocked}
            onToggle={onToggleSite}
          />
        ))}
      </ul>
    </div>
  );
};
