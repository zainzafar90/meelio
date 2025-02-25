import { BackgroundType } from "../schema/background.schema";

export const defaultBackgrounds = [
  {
    id: "default-nature-1",
    userId: "default",
    type: BackgroundType.STATIC,
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    metadata: {
      name: "Mountain Lake",
      category: "nature",
      tags: ["mountains", "lake", "landscape"],
      thumbnailUrl:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "default-nature-2",
    userId: "default",
    type: BackgroundType.STATIC,
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0",
    metadata: {
      name: "Ocean Waves",
      category: "nature",
      tags: ["ocean", "waves", "beach"],
      thumbnailUrl:
        "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "default-nature-3",
    userId: "default",
    type: BackgroundType.LIVE,
    url: "https://player.vimeo.com/video/291787415",
    metadata: {
      name: "Forest Stream",
      category: "nature",
      tags: ["forest", "stream", "relaxing"],
      thumbnailUrl: "https://i.vimeocdn.com/video/291787415_400x225.jpg",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
