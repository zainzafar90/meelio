import { useEffect } from "react";
import { useDockStore } from "../stores/dock.store";

export function useDockShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      const store = useDockStore.getState();

      switch (e.key) {
        case "1":
          e.preventDefault();
          store.toggleTimer();
          break;
        case "2":
          e.preventDefault();
          store.toggleBreathing();
          break;
        case "3":
          e.preventDefault();
          store.toggleSoundscapes();
          break;
        case "4":
          e.preventDefault();
          store.toggleTasks();
          break;
        case "5":
          e.preventDefault();
          store.toggleNotes();
          break;
        case "6":
          e.preventDefault();
          store.toggleSiteBlocker();
          break;
        case "7":
          e.preventDefault();
          store.toggleTabStash();
          break;
        case "8":
          e.preventDefault();
          store.toggleBookmarks();
          break;
        case "9":
          e.preventDefault();
          store.toggleBackgrounds();
          break;
      }
    };

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
] as const;
