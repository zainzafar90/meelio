import { isChromeExtension } from "./common.utils";

/**
 * Simple sound URL resolver that handles extension vs webapp differences
 * - Extension: sounds are bundled locally (offline capable by default)
 * - Web app: sounds load from server
 * - CDN URLs: passed through unchanged
 */
export function getSoundUrl(path: string): string {
  // If it's already a full URL (CDN), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (isChromeExtension()) {
    // Extension: use chrome.runtime.getURL for bundled assets
    // Remove leading slash for chrome.runtime.getURL
    const cleanPath = path.replace(/^\//, '');
    return chrome.runtime.getURL(cleanPath);
  } else {
    // Web app: remove /public prefix as it's served from root
    return path.replace(/^\/public/, '');
  }
}