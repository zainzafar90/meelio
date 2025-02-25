import type { Background } from "../db/models";

const now = Date.now();

export const defaultBackgrounds: Omit<Background, "userId" | "_syncStatus">[] =
  [
    {
      id: "default-1",
      name: "Mountain Lake",
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
      type: "image",
      category: "nature",
      tags: ["mountains", "lake", "landscape"],
      isCustom: false,
      isFavorite: false,
      _lastModified: now,
      _version: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "default-2",
      name: "Ocean Waves",
      url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400",
      type: "image",
      category: "nature",
      tags: ["ocean", "waves", "beach"],
      isCustom: false,
      isFavorite: false,
      _lastModified: now,
      _version: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "default-3",
      name: "Forest Path",
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
      type: "image",
      category: "nature",
      tags: ["forest", "trees", "path"],
      isCustom: false,
      isFavorite: false,
      _lastModified: now,
      _version: 1,
      createdAt: now,
      updatedAt: now,
    },
  ];
