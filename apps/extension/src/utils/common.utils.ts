export const env = process.env
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
