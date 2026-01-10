import { useEffect } from "react";
import { useDockStore } from "../stores/dock.store";

type DockStoreToggleKey =
  | "toggleTimer"
  | "toggleBreathing"
  | "toggleSoundscapes"
  | "toggleTasks"
  | "toggleNotes"
  | "toggleSiteBlocker"
  | "toggleTabStash"
  | "toggleBookmarks"
  | "toggleBackgrounds"
  | "toggleCalendar";

const SHORTCUT_KEY_TO_TOGGLE: Record<string, DockStoreToggleKey> = {
  "1": "toggleTimer",
  "2": "toggleBreathing",
  "3": "toggleSoundscapes",
  "4": "toggleTasks",
  "5": "toggleNotes",
  "6": "toggleSiteBlocker",
  "7": "toggleTabStash",
  "8": "toggleBookmarks",
  "9": "toggleBackgrounds",
  "0": "toggleCalendar",
};

function isInputElement(element: Element | null): boolean {
  if (!element) return false;
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element.getAttribute("contenteditable") === "true"
  );
}

export function useDockShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (isInputElement(document.activeElement)) return;

      const toggleKey = SHORTCUT_KEY_TO_TOGGLE[e.key];
      if (!toggleKey) return;

      e.preventDefault();
      const store = useDockStore.getState();
      store[toggleKey]();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}

export const DOCK_SHORTCUTS = [
  { key: "1", label: "Timer" },
  { key: "2", label: "Breathing" },
  { key: "3", label: "Soundscapes" },
  { key: "4", label: "Tasks" },
  { key: "5", label: "Notes" },
  { key: "6", label: "Site Blocker" },
  { key: "7", label: "Tab Stash" },
  { key: "8", label: "Bookmarks" },
  { key: "9", label: "Backgrounds" },
  { key: "0", label: "Calendar" },
] as const;
