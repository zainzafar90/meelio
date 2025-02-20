import { SITE_LIST } from "../data/site-list";
import { SiteItem } from "./site-item";

interface CustomSitesProps {
  blockedSites: string[];
  onToggleSite: (site: string) => void;
}

export const CustomBlockedSites = ({
  blockedSites,
  onToggleSite,
}: CustomSitesProps) => {
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
