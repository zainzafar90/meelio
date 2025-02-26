import { db } from "@/db";
import { Background, BackgroundInsert, backgrounds } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

import { defaultBackgrounds } from "./data/default-backgrounds";

export const backgroundService = {
  /**
   * Get all backgrounds for a user, including default backgrounds
   */
  getBackgrounds: async (userId: string) => {
    const userBackgrounds = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.userId, userId));

    const allBackgrounds = [
      ...userBackgrounds,
      ...defaultBackgrounds.map((bg) => ({
        ...bg,
        isSelected: false,
      })),
    ];

    return allBackgrounds;
  },

  /**
   * Get a background by ID (user-specific or default)
   */
  getBackgroundById: async (id: string) => {
    const defaultBackground = defaultBackgrounds.find((bg) => bg.id === id);
    if (defaultBackground) {
      return defaultBackground;
    }

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
    await db
      .update(backgrounds)
      .set({ isSelected: false } as Background)
      .where(
        and(eq(backgrounds.userId, userId), eq(backgrounds.isSelected, true))
      );

    const isDefaultBackground = defaultBackgrounds.some(
      (bg) => bg.id === backgroundId
    );

    if (isDefaultBackground) {
      const existingRef = await db
        .select()
        .from(backgrounds)
        .where(
          and(
            eq(backgrounds.userId, userId),
            eq(backgrounds.defaultBackgroundId, backgroundId)
          )
        )
        .limit(1);

      if (existingRef.length > 0) {
        const updatedBackground = await db
          .update(backgrounds)
          .set({
            isSelected: true,
            updatedAt: new Date(),
          } as Background)
          .where(eq(backgrounds.id, existingRef[0].id))
          .returning();

        return updatedBackground[0];
      } else {
        const defaultBg = defaultBackgrounds.find(
          (bg) => bg.id === backgroundId
        );

        const newBackground = await db
          .insert(backgrounds)
          .values({
            userId,
            type: defaultBg.type,
            url: defaultBg.url,
            metadata: defaultBg.metadata,
            isSelected: true,
            defaultBackgroundId: backgroundId,
          } as BackgroundInsert)
          .returning();

        return newBackground[0];
      }
    } else {
      const updatedBackground = await db
        .update(backgrounds)
        .set({
          isSelected: true,
          updatedAt: new Date(),
        } as Background)
        .where(eq(backgrounds.id, backgroundId))
        .returning();

      if (updatedBackground.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
      }

      return updatedBackground[0];
    }
  },

  /**
   * Get a random background (for daily rotation)
   */
  getRandomBackground: async () => {
    const randomIndex = Math.floor(Math.random() * defaultBackgrounds.length);
    return defaultBackgrounds[randomIndex];
  },

  /**
   * Create a new background
   */
  createBackground: async (userId: string, backgroundData: any) => {
    const { type, url, metadata, schedule } = backgroundData;

    const updatedMetadata = {
      ...(metadata || {}),
      blurhash: metadata?.blurhash || "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
    };

    const newBackground = await db
      .insert(backgrounds)
      .values({
        userId,
        type,
        url,
        metadata: updatedMetadata,
        schedule: schedule || {},
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

    if ("isDefault" in background && background.isDefault) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Cannot update default backgrounds"
      );
    }

    const { type, url, metadata, schedule } = backgroundData;

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

    if ("isDefault" in background && background.isDefault) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Cannot delete default backgrounds"
      );
    }

    await db.delete(backgrounds).where(eq(backgrounds.id, id));
  },
};
