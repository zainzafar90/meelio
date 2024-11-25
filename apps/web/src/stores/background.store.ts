import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Background {
  id: string;
  url: string;
  title: string;
  author: string;
  thumbnail: string;
  source: "unsplash" | "custom";
}

interface BackgroundState {
  backgrounds: Background[];
  currentBackground: Background | null;
  addBackground: (background: Background) => void;
  removeBackground: (id: string) => void;
  setCurrentBackground: (background: Background) => void;
}

const DEFAULT_BACKGROUNDS: Background[] = [
  {
    id: "default-1",
    url: "https://images.unsplash.com/photo-1505699261378-c372af38134c",
    title: "Gray Bridge Golden Hour",
    thumbnail:
      "https://images.unsplash.com/photo-1505699261378-c372af38134c?w=160&fit=max",
    author: "Unsplash",
    source: "unsplash",
  },
  {
    id: "default-2",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    title: "Foggy Forest",
    thumbnail:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=160&fit=max",
    author: "Unsplash",
    source: "unsplash",
  },
  {
    id: "default-3",
    url: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1",
    title: "Mountain Lake",
    thumbnail:
      "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=160&fit=max",
    author: "Unsplash",
    source: "unsplash",
  },
];

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      backgrounds: DEFAULT_BACKGROUNDS,
      currentBackground: DEFAULT_BACKGROUNDS[0],

      addBackground: (background) =>
        set((state) => ({
          backgrounds: [...state.backgrounds, background],
        })),

      removeBackground: (id) =>
        set((state) => ({
          backgrounds: state.backgrounds.filter((bg) => bg.id !== id),
        })),

      setCurrentBackground: (background) =>
        set({
          currentBackground: background,
        }),
    }),
    {
      name: "background-storage",
    }
  )
);
