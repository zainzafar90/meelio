import { db } from "@/db";
import { Background, BackgroundInsert, backgrounds } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

import { defaultBackgrounds } from "./data/default-backgrounds";

/**
 * Background service for handling background operations
 * This follows the singleton pattern to ensure only one instance exists
 */
export class BackgroundService {
  // Singleton instance
  private static instance: BackgroundService;

  private constructor() {}

  /**
   * Get the singleton instance of the background service
   * @returns {BackgroundService} The background service instance
   */
  public static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  /**
   * Get all backgrounds for a user, including default backgrounds
   * @param {string} userId - The user ID
   * @returns {Promise<object[]>} The backgrounds
   */
  async getBackgrounds(userId: string) {
    // Get user-specific backgrounds
    const userBackgrounds = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.userId, userId));

    // We don't have an isSelected field in the schema, so we'll just return all backgrounds
    // without marking any as selected
    const allBackgrounds = [
      ...userBackgrounds.map((bg) => ({
        ...bg,
        isSelected: bg.isSelected, // Use the field from the schema
      })),
      ...defaultBackgrounds.map((bg) => ({
        ...bg,
        isSelected: false, // Adding this property for the frontend, but it's not in the DB
      })),
    ];

    return allBackgrounds;
  }

  /**
   * Get a background by ID (user-specific or default)
   * @param {string} id - The background ID
   * @returns {Promise<object|null>} The background or null if not found
   */
  async getBackgroundById(id: string) {
    // Check if it's a default background
    const defaultBackground = defaultBackgrounds.find((bg) => bg.id === id);
    if (defaultBackground) {
      return defaultBackground;
    }

    // Otherwise, look in the database
    const background = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.id, id))
      .limit(1);

    if (background.length === 0) {
      return null;
    }

    return background[0];
  }

  /**
   * Set a background as selected for a user
   * @param {string} userId - The user ID
   * @param {string} backgroundId - The background ID to select
   * @returns {Promise<object>} The selected background
   */
  async setSelectedBackground(userId: string, backgroundId: string) {
    // First, unselect any currently selected background
    await db
      .update(backgrounds)
      .set({ isSelected: false } as Background)
      .where(
        and(eq(backgrounds.userId, userId), eq(backgrounds.isSelected, true))
      );

    // Check if the background to select is a default one
    const isDefaultBackground = defaultBackgrounds.some(
      (bg) => bg.id === backgroundId
    );

    if (isDefaultBackground) {
      // If it's a default background, we need to create a reference in the user's backgrounds
      // First check if the user already has a reference to this default background
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
        // Update the existing reference
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
        // Create a new reference
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
      // If it's a user-created background, just mark it as selected
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
  }

  /**
   * Get a random background (for daily rotation)
   * @returns {Promise<object>} A randomly selected background
   */
  async getRandomBackground() {
    // For simplicity, just return a random default background
    const randomIndex = Math.floor(Math.random() * defaultBackgrounds.length);
    return defaultBackgrounds[randomIndex];
  }

  /**
   * Create a new background
   * @param {string} userId - The user ID
   * @param {object} backgroundData - The background data
   * @returns {Promise<object>} The created background
   */
  async createBackground(userId: string, backgroundData: any) {
    const { type, url, metadata, schedule } = backgroundData;

    // Ensure metadata has a blurhash if not provided
    const updatedMetadata = {
      ...(metadata || {}),
      blurhash: metadata?.blurhash || "LKO2?U%2Tw=w]~RBVZRi};RPxuwH", // Default blurhash if none provided
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
  }

  /**
   * Update a background
   * @param {string} id - The background ID
   * @param {object} backgroundData - The background data to update
   * @returns {Promise<object>} The updated background
   */
  async updateBackground(id: string, backgroundData: any) {
    const background = await this.getBackgroundById(id);

    if (!background) {
      throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
    }

    // Don't allow updating default backgrounds
    if ("isDefault" in background && background.isDefault) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Cannot update default backgrounds"
      );
    }

    const { type, url, metadata, schedule } = backgroundData;

    // Ensure metadata has a blurhash if provided
    let updatedMetadata = metadata;
    if (metadata && !metadata.blurhash) {
      updatedMetadata = {
        ...metadata,
        blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH", // Default blurhash if none provided
      };
    }

    // Build update object with only provided fields
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
  }

  /**
   * Delete a background
   * @param {string} id - The background ID
   * @returns {Promise<void>}
   */
  async deleteBackground(id: string) {
    const background = await this.getBackgroundById(id);

    if (!background) {
      throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
    }

    // Don't allow deleting default backgrounds
    if ("isDefault" in background && background.isDefault) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Cannot delete default backgrounds"
      );
    }

    await db.delete(backgrounds).where(eq(backgrounds.id, id));
  }
}

// Export the background service instance
export const backgroundService = BackgroundService.getInstance();
