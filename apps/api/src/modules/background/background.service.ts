import { db } from "@/db";
import {
  Background,
  BackgroundInsert,
  backgrounds,
  UserBackgroundView,
  UserBackgroundViewInsert,
  userBackgroundViews,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

import { defaultBackgrounds } from "./data/default-backgrounds";

export const backgroundService = {
  /**
   * Get all backgrounds for a user, including which one is selected
   * Backgrounds are sorted by creation date (newest first)
   */
  getBackgrounds: async (userId: string) => {
    // Get all background IDs the user has already seen
    const viewedBackgroundIds = await db
      .select({ id: userBackgroundViews.backgroundId })
      .from(userBackgroundViews)
      .where(eq(userBackgroundViews.userId, userId));

    const viewedIds = viewedBackgroundIds.map((b) => b.id);

    // Get all global backgrounds, sorted by creation date (newest first)
    const allBackgrounds = await db
      .select()
      .from(backgrounds)
      .orderBy(desc(backgrounds.createdAt));

    // Get user's currently selected background, if any
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

    // Find backgrounds the user hasn't seen yet
    const unseenBackgrounds = allBackgrounds.filter(
      (bg) => !viewedIds.includes(bg.id)
    );

    // For any unseen backgrounds, create a view record for the user
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

    // Transform all backgrounds to add isSelected flag
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
    const background = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.id, backgroundId))
      .limit(1);

    if (background.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
    }

    // Reset any currently selected background
    await db
      .update(userBackgroundViews)
      .set({ isSelected: false } as UserBackgroundView)
      .where(
        and(
          eq(userBackgroundViews.userId, userId),
          eq(userBackgroundViews.isSelected, true)
        )
      );

    // Check if the user has a view for this background
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
      // Update existing view
      const updatedView = await db
        .update(userBackgroundViews)
        .set({
          isSelected: true,
          updatedAt: new Date(),
        } as UserBackgroundView)
        .where(eq(userBackgroundViews.id, existingView[0].id))
        .returning();

      return { ...background[0], isSelected: true };
    } else {
      // Create a new view
      await db.insert(userBackgroundViews).values({
        userId,
        backgroundId,
        isSelected: true,
      } as UserBackgroundViewInsert);

      return { ...background[0], isSelected: true };
    }
  },
};
