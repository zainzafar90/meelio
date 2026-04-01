import { useState, useEffect } from "react";

export function useChromeStorageLocal<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    chrome.storage.local.get(key).then((result) => {
      if (result[key] !== undefined) {
        setValue(result[key] as T);
      }
    });

    const handler = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === "local" && key in changes) {
        setValue((changes[key].newValue as T) ?? defaultValue);
      }
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [key]);

  const set = async (newValue: T): Promise<void> => {
    await chrome.storage.local.set({ [key]: newValue });
  };

  return [value, set];
}
