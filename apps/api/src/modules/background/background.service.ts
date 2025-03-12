import { db } from "@/db";
import {
  backgrounds,
  UserBackgroundView,
  UserBackgroundViewInsert,
  userBackgroundViews,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

import wallpapers from "./data/wallpapers.json";

interface BackgroundApiResponse {
  id: string;
  type: string;
  isFavourite: boolean;
  url: string;
  metadata: {
    name: string;
    category: string;
    thumbnailUrl: string;
    blurhash: string;
    fallbackImage?: string;
  };
}

export const backgroundService = {
  getBackgrounds: async (userId: string) => {
    const viewedBackgroundIds = await db
      .select({ id: userBackgroundViews.backgroundId })
      .from(userBackgroundViews)
      .where(eq(userBackgroundViews.userId, userId));

    const viewedIds = viewedBackgroundIds.map((b) => b.id);

    const selectedView = await db
      .select()
      .from(userBackgroundViews)
      .where(
        and(
          eq(userBackgroundViews.userId, userId),
          eq(userBackgroundViews.isFavourite, true)
        )
      )
      .limit(1);

    const selectedBackgroundId =
      selectedView.length > 0 ? selectedView[0].backgroundId : null;

    const unseenWallpapers = wallpapers.filter(
      (bg) => !viewedIds.includes(bg.id)
    );
    const seenWallpapers = wallpapers.filter((bg) => viewedIds.includes(bg.id));

    let wallpaperList = [...unseenWallpapers, ...seenWallpapers].slice(0, 10);

    // Transform wallpapers to match the expected API format
    const result: BackgroundApiResponse[] = wallpaperList.map((bg: any) => {
      const transformed: BackgroundApiResponse = {
        id: bg.id,
        type: bg.type,
        isFavourite: bg.id === selectedBackgroundId,
        url: bg.type === "static" ? bg.url : bg.video?.src,
        metadata: {
          name: bg.title,
          category: bg.author,
          thumbnailUrl: bg.thumbnail,
          blurhash: bg.blurhash,
        },
      };

      // Add fallbackImage for live wallpapers
      if (bg.type === "live" && bg.video) {
        transformed.metadata.fallbackImage = bg.video.fallbackImage;
      }

      return transformed;
    });

    const unseenBackgroundsToInsert = unseenWallpapers
      .filter((bg) => wallpaperList.some((r) => r.id === bg.id))
      .map((bg) => ({
        userId,
        backgroundId: bg.id,
        isFavourite: false,
      }));

    if (unseenBackgroundsToInsert.length > 0) {
      await db.insert(userBackgroundViews).values(unseenBackgroundsToInsert);
    }

    return result.sort((a, b) => Number(b.isFavourite) - Number(a.isFavourite));
  },

  /** Set a background as favourite for a user */
  setFavouriteBackground: async (userId: string, backgroundId: string) => {
    const backgroundExists = wallpapers.some((bg) => bg.id === backgroundId);

    if (!backgroundExists) {
      throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
    }

    await db
      .update(userBackgroundViews)
      .set({ isFavourite: false } as UserBackgroundView)
      .where(
        and(
          eq(userBackgroundViews.userId, userId),
          eq(userBackgroundViews.isFavourite, true)
        )
      );

    const existingView = await db
      .select()
      .from(userBackgroundViews)
      .where(
        and(
          eq(userBackgroundViews.userId, userId),
          eq(userBackgroundViews.backgroundId, backgroundId)
        )
      )
      .limit(1);

    if (existingView.length > 0) {
      await db
        .update(userBackgroundViews)
        .set({
          isFavourite: true,
          updatedAt: new Date(),
        } as UserBackgroundView)
        .where(eq(userBackgroundViews.id, existingView[0].id));
    } else {
      await db.insert(userBackgroundViews).values({
        userId,
        backgroundId,
        isFavourite: true,
      } as UserBackgroundViewInsert);
    }

    // Find the background and transform it to the expected format
    const background = wallpapers.find((bg) => bg.id === backgroundId);
    if (background) {
      const transformed: BackgroundApiResponse = {
        id: background.id,
        type: background.type,
        isFavourite: true,
        url:
          background.type === "static" ? background.url : background.video?.src,
        metadata: {
          name: background.title,
          category: background.author,
          thumbnailUrl: background.thumbnail,
          blurhash: background.blurhash,
        },
      };

      if (background.type === "live" && background.video) {
        transformed.metadata.fallbackImage = background.video.fallbackImage;
      }

      return transformed;
    }

    return null;
  },
};
