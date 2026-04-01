import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(__dirname, "../../..");
export const extensionOutputDir = path.join(
  repoRoot,
  "apps/extension/.output/chrome-mv3"
);
export const blockerPattern =
  process.env.MEELIO_BLOCK_TEST_DOMAIN || "zainzafar.net";
export const blockedPageSuffix = "/blocked.html";
export const validationLocale =
  process.env.MEELIO_VALIDATION_LOCALE || "en-US";
export const isCi = process.env.CI === "true";
export const browserStartupTimeoutMs = Number(
  process.env.MEELIO_BROWSER_STARTUP_TIMEOUT_MS ||
    (isCi ? 45000 : 15000)
);
export const pregrantBlockerAccess =
  process.env.MEELIO_PREGRANT_BLOCKER_ACCESS === "true" ||
  (isCi && process.env.MEELIO_PREGRANT_BLOCKER_ACCESS !== "false");
export const tempDirCleanupTimeoutMs = Number(
  process.env.MEELIO_TEMP_DIR_CLEANUP_TIMEOUT_MS || 4000
);
export const browserCandidates = [
  process.env.MEELIO_BROWSER_PATH,
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
