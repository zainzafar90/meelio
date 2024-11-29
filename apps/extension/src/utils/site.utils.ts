import { DEFAULT_SITES, type BlockedSite } from "@/config/sites"

export const getCustomBlockerMessage = (): BlockedSite=> {
  return DEFAULT_SITES[Math.floor(Math.random() * DEFAULT_SITES.length)]
}
