import { isChromeExtension } from "./common.utils";

/**
 * Returns the correct asset path based on whether the app is running as a Chrome extension
 * @param path Path to the asset (should start with /public)
 * @returns Corrected path for the current environment
 */
export const getAssetPath = (path: string): string => {
  if (isChromeExtension()) {
    return path;
  }

  return path.replace(/^\/public/, "");
};
