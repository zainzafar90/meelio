import { db } from "@/db";
import { backgrounds } from "@/db/schema";
import { eq } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

// Default backgrounds that will be available to all users
const defaultBackgrounds = [
  {
    id: "default-1",
    type: "static",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    metadata: {
      name: "Mountain Lake",
      category: "Nature",
      tags: ["mountains", "lake", "landscape"],
      thumbnailUrl:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80",
    },
    isDefault: true,
  },
  {
    id: "default-2",
    type: "static",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    metadata: {
      name: "Beach Sunset",
      category: "Nature",
      tags: ["beach", "sunset", "ocean"],
      thumbnailUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
    },
    isDefault: true,
  },
  {
    id: "default-3",
    type: "static",
    url: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1",
    metadata: {
      name: "Forest Path",
      category: "Nature",
      tags: ["forest", "path", "trees"],
      thumbnailUrl:
        "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=400&q=80",
    },
    isDefault: true,
  },
  {
    id: "default-4",
    type: "live",
    url: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4",
    metadata: {
      name: "Ocean Waves",
      category: "Nature",
      tags: ["ocean", "waves", "water"],
      thumbnailUrl:
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=80",
    },
    isDefault: true,
  },
];

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

    // Get the currently selected background for the user
    const selectedBackground = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.userId, userId))
      .where(eq(backgrounds.isSelected, true));

    const selectedBackgroundId =
      selectedBackground.length > 0 ? selectedBackground[0].id : null;

    // Combine user backgrounds with default backgrounds
    // Mark the selected background
    const allBackgrounds = [
      ...userBackgrounds.map((bg) => ({
        ...bg,
        isSelected: bg.id === selectedBackgroundId,
      })),
      ...defaultBackgrounds.map((bg) => ({
        ...bg,
        isSelected: bg.id === selectedBackgroundId,
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
      .where(eq(backgrounds.id, id));

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
      .set({ isSelected: false })
      .where(eq(backgrounds.userId, userId))
      .where(eq(backgrounds.isSelected, true));

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
        .where(eq(backgrounds.userId, userId))
        .where(eq(backgrounds.defaultBackgroundId, backgroundId));

      if (existingRef.length > 0) {
        // Update the existing reference
        const result = await db
          .update(backgrounds)
          .set({
            isSelected: true,
            updatedAt: new Date(),
          })
          .where(eq(backgrounds.id, existingRef[0].id))
          .returning();

        return result[0];
      } else {
        // Create a new reference
        const defaultBg = defaultBackgrounds.find(
          (bg) => bg.id === backgroundId
        );
        const result = await db
          .insert(backgrounds)
          .values({
            userId,
            type: defaultBg.type,
            url: defaultBg.url,
            metadata: defaultBg.metadata,
            isSelected: true,
            defaultBackgroundId: backgroundId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return result[0];
      }
    } else {
      // If it's a user-created background, just mark it as selected
      const result = await db
        .update(backgrounds)
        .set({
          isSelected: true,
          updatedAt: new Date(),
        })
        .where(eq(backgrounds.id, backgroundId))
        .returning();

      if (result.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
      }

      return result[0];
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
    const result = await db
      .insert(backgrounds)
      .values({
        userId,
        ...backgroundData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
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
    if (background.isDefault) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Cannot update default backgrounds"
      );
    }

    const result = await db
      .update(backgrounds)
      .set({
        ...backgroundData,
        updatedAt: new Date(),
      })
      .where(eq(backgrounds.id, id))
      .returning();

    return result[0];
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
    if (background.isDefault) {
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
