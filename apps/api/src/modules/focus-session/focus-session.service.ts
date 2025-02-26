import { db } from "@/db";
import { FocusSession, FocusSessionInsert, focusSessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface CreateFocusSessionData {
  sessionStart: Date;
  sessionEnd: Date;
  duration: number;
}

type UpdateFocusSessionData = Partial<CreateFocusSessionData>;

export const focusSessionService = {
  /**
   * Get focus sessions for a user
   */
  getFocusSessions: async (userId: string): Promise<FocusSession[]> => {
    return await db
      .select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId))
      .orderBy(desc(focusSessions.sessionStart));
  },

  /**
   * Get a focus session by ID
   */
  getFocusSessionById: async (
    id: string,
    userId: string
  ): Promise<FocusSession> => {
    const result = await db
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)));

    if (result.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Focus session not found");
    }

    return result[0];
  },

  /**
   * Create a focus session
   */
  createFocusSession: async (
    userId: string,
    data: CreateFocusSessionData
  ): Promise<FocusSession> => {
    const sessionData: FocusSessionInsert = {
      userId,
      sessionStart: new Date(data.sessionStart),
      sessionEnd: new Date(data.sessionEnd),
      duration: data.duration,
    };

    const result = await db
      .insert(focusSessions)
      .values(sessionData)
      .returning();

    return result[0];
  },

  /**
   * Update a focus session
   */
  updateFocusSession: async (
    id: string,
    userId: string,
    data: UpdateFocusSessionData
  ): Promise<FocusSession> => {
    // Check if focus session exists
    await focusSessionService.getFocusSessionById(id, userId);

    const updateData: Partial<FocusSessionInsert> = {};

    if (data.sessionStart) {
      updateData.sessionStart = new Date(data.sessionStart);
    }

    if (data.sessionEnd) {
      updateData.sessionEnd = new Date(data.sessionEnd);
    }

    if (data.duration) {
      updateData.duration = data.duration;
    }

    const result = await db
      .update(focusSessions)
      .set(updateData)
      .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)))
      .returning();

    return result[0];
  },

  /**
   * Delete a focus session
   */
  deleteFocusSession: async (id: string, userId: string): Promise<void> => {
    // Check if focus session exists
    await focusSessionService.getFocusSessionById(id, userId);

    await db
      .delete(focusSessions)
      .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)));
  },
};
