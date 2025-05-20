import { useAuthStore } from "../stores/auth.store";

export const MINUTE_IN_SECONDS = 60; // 1 minute
export const POMODORO_MAX_MINUTES = 300; // 300 minutes

/*
|--------------------------------------------------------------------------
| Copy to Clipboard
|--------------------------------------------------------------------------
|
| These functions copy a given text to the clipboard. They are used to
| copy the post URL to the clipboard when the user clicks the "Copy URL"
| button in the post preview.
|
| copyToClipboard copies the given text to the clipboard. fallbackCopyToClipboard
| is a fallback method if the Clipboard API is not supported.
|
*/
export const copyToClipboard = (text: string) => {
  if (!navigator.clipboard) {
    fallbackCopyToClipboard(text);
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.info("Text copied to clipboard");
    })
    .catch((error) => {
      console.error("Error copying text to clipboard:", error);
    });
};

// Fallback method if Clipboard API is not supported
const fallbackCopyToClipboard = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export const isChromeExtension = () => {
  return typeof chrome !== "undefined" && chrome.runtime;
};

/**
 * Get the day of the year (1-366)
 * @returns {number} The day of the year
 */
const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

/**
 * Get a seed value based on the user's ID to be used for random number generation for wallpapers, mantras & quotes
 * @returns {number} The seed value
 */
export const getSeedByUser = () => {
  const { user, guestUser } = useAuthStore.getState();
  const seed = user?.id || guestUser?.id || "default";
  return seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

/**
 * Get a seeded index based on the day of year and user seed
 * @param totalItems {number} Total number of items to choose from
 * @returns {number} The seeded index
 */
export const getSeedIndexByDate = (totalItems: number) => {
  const dayOfYear = getDayOfYear();
  const seed = getSeedByUser();
  return (dayOfYear + seed) % totalItems;
};
