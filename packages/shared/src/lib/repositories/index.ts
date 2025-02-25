import { BackgroundRepository } from "./backgroundRepository";
import { SiteBlockerRepository } from "./siteBlockerRepository";

export const backgroundRepository = new BackgroundRepository();
export const siteBlockerRepository = new SiteBlockerRepository();

export { BackgroundRepository, SiteBlockerRepository };

// Database
export * from "../db";
export * from "../db/models";

// Sync
export * from "../sync/queue";
export * from "../sync/conflictResolver";

// Repositories
export * from "./backgroundRepository";
export * from "./siteBlockerRepository";

// Hooks
export * from "../hooks/useBackgrounds";
export * from "../hooks/useSiteBlockers";
