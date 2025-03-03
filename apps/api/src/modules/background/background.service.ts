import { db } from "@/db";
import {
  Background,
  BackgroundInsert,
  backgrounds,
  UserBackgroundView,
  UserBackgroundViewInsert,
  userBackgroundViews,
} from "@/db/schema";
import { eq, and, not, inArray } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

import { defaultBackgrounds } from "./data/default-backgrounds";

export const backgroundService = {
  /**
   * Get all backgrounds for a user, including default backgrounds
   * Returns backgrounds the user hasn't seen yet, plus previously seen backgrounds
   */
  getBackgrounds: async (userId: string) => {
    const viewedBackgroundIds = await db
      .select({ id: userBackgroundViews.backgroundId })
      .from(userBackgroundViews)
      .where(eq(userBackgroundViews.userId, userId));

    const viewedIds = viewedBackgroundIds.map((b) => b.id);

    const allBackgrounds = await db.select().from(backgrounds);

    const selectedView = await db
      .select()
      .from(userBackgroundViews)
      .where(
        and(
          eq(userBackgroundViews.userId, userId),
          eq(userBackgroundViews.isSelected, true)
        )
      )
      .limit(1);

    const selectedBackgroundId =
      selectedView.length > 0 ? selectedView[0].backgroundId : null;

    const unseenBackgrounds = allBackgrounds.filter(
      (bg) => !viewedIds.includes(bg.id)
    );

    if (unseenBackgrounds.length > 0) {
      const viewsToInsert: UserBackgroundViewInsert[] = unseenBackgrounds.map(
        (bg) => ({
          userId,
          backgroundId: bg.id,
          isSelected: false,
        })
      );

      await db.insert(userBackgroundViews).values(viewsToInsert);
    }

    const enrichedBackgrounds = allBackgrounds.map((bg) => ({
      ...bg,
      isSelected: bg.id === selectedBackgroundId,
    }));

    return enrichedBackgrounds;
  },

  /**
   * Get a background by ID (user-specific or default)
   */
  getBackgroundById: async (id: string) => {
    const background = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.id, id))
      .limit(1);

    if (background.length === 0) {
      return null;
    }

    return background[0];
  },

  /**
   * Set a background as selected for a user
   */
  setSelectedBackground: async (userId: string, backgroundId: string) => {
    // First, verify the background exists
    const background = await backgroundService.getBackgroundById(backgroundId);
    if (!background) {
      throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
    }

    await db
      .update(userBackgroundViews)
      .set({ isSelected: false } as UserBackgroundView)
      .where(
        and(
          eq(userBackgroundViews.userId, userId),
          eq(userBackgroundViews.isSelected, true)
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
      const updatedView = await db
        .update(userBackgroundViews)
        .set({
          isSelected: true,
          updatedAt: new Date(),
        } as UserBackgroundView)
        .where(eq(userBackgroundViews.id, existingView[0].id))
        .returning();

      return { ...background, isSelected: true };
    } else {
      await db.insert(userBackgroundViews).values({
        userId,
        backgroundId,
        isSelected: true,
      } as UserBackgroundViewInsert);

      return { ...background, isSelected: true };
    }
  },

  /**
   * Get a random background (for daily rotation)
   */
  getRandomBackground: async () => {
    const allBackgrounds = await db.select().from(backgrounds);

    if (allBackgrounds.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * allBackgrounds.length);
    return allBackgrounds[randomIndex];
  },

  /**
   * Create a new background (global)
   */
  createBackground: async (backgroundData: any) => {
    const { type, url, metadata, schedule, isDefault } = backgroundData;

    const updatedMetadata = {
      ...(metadata || {}),
      blurhash: metadata?.blurhash || "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
    };

    const newBackground = await db
      .insert(backgrounds)
      .values({
        type,
        url,
        metadata: updatedMetadata,
        schedule: schedule || {},
        isDefault: isDefault || false,
      } as BackgroundInsert)
      .returning();

    return newBackground[0];
  },

  /**
   * Update a background
   */
  updateBackground: async (id: string, backgroundData: any) => {
    const background = await backgroundService.getBackgroundById(id);

    if (!background) {
      throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
    }

    const { type, url, metadata, schedule, isDefault } = backgroundData;

    let updatedMetadata = metadata;
    if (metadata && !metadata.blurhash) {
      updatedMetadata = {
        ...metadata,
        blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
      };
    }

    const updateData: any = { updatedAt: new Date() };
    if (type !== undefined) updateData.type = type;
    if (url !== undefined) updateData.url = url;
    if (updatedMetadata !== undefined) updateData.metadata = updatedMetadata;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedBackground = await db
      .update(backgrounds)
      .set(updateData)
      .where(eq(backgrounds.id, id))
      .returning();

    return updatedBackground[0];
  },

  /**
   * Delete a background
   */
  deleteBackground: async (id: string) => {
    const background = await backgroundService.getBackgroundById(id);

    if (!background) {
      throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
    }

    await db
      .delete(userBackgroundViews)
      .where(eq(userBackgroundViews.backgroundId, id));

    await db.delete(backgrounds).where(eq(backgrounds.id, id));
  },
};
