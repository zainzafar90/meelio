import { SiteBlockerSheet } from "@repo/shared";

import { useExtensionSiteBlockerStore } from "../stores/extension.site-blocker.store";

export const ExtensionSiteBlockerSheet = () => {
  return <SiteBlockerSheet siteBlockerStore={useExtensionSiteBlockerStore} />;
};
