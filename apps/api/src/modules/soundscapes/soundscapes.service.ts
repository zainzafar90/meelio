import { db } from "@/db";
import { Soundscape, SoundscapeInsert, soundscapes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface CreateSoundscapeData {
  name: string;
  config?: Record<string, any> | null;
  shareable?: boolean;
}

type UpdateSoundscapeData = Partial<CreateSoundscapeData>;

export const soundscapesService = {
  /**
   * Get soundscapes for a user with optional filters
   */
  async getSoundscapes(
    userId: string,
    filters: { shareable?: boolean }
  ): Promise<Soundscape[]> {
    const conditions = [eq(soundscapes.userId, userId)];

    if (filters.shareable !== undefined) {
      conditions.push(eq(soundscapes.shareable, filters.shareable));
    }

    return await db
      .select()
      .from(soundscapes)
      .where(and(...conditions))
      .orderBy(desc(soundscapes.createdAt));
  },

  /**
   * Get a specific soundscape by ID
   */
  async getSoundscapeById(
    userId: string,
    soundscapeId: string
  ): Promise<Soundscape> {
    const soundscape = await db
      .select()
      .from(soundscapes)
      .where(
        and(eq(soundscapes.id, soundscapeId), eq(soundscapes.userId, userId))
      );

    if (!soundscape.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Soundscape not found");
    }

    return soundscape[0];
  },

  /**
   * Create a new soundscape
   */
  async createSoundscape(
    userId: string,
    soundscapeData: CreateSoundscapeData
  ): Promise<Soundscape> {
    if (!soundscapeData.name) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Name is required");
    }

    const insertData = {
      userId,
      name: soundscapeData.name,
      config: soundscapeData.config ?? null,
      shareable: soundscapeData.shareable ?? false,
    } as SoundscapeInsert;

    const result = await db.insert(soundscapes).values(insertData).returning();
    return result[0];
  },

  /**
   * Update an existing soundscape
   */
  async updateSoundscape(
    userId: string,
    soundscapeId: string,
    updateData: UpdateSoundscapeData
  ): Promise<Soundscape> {
    await this.getSoundscapeById(userId, soundscapeId);

    const data: Partial<Soundscape> = {};

    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.config !== undefined) data.config = updateData.config;
    if (updateData.shareable !== undefined)
      data.shareable = updateData.shareable;

    const result = await db
      .update(soundscapes)
      .set(data)
      .where(
        and(eq(soundscapes.id, soundscapeId), eq(soundscapes.userId, userId))
      )
      .returning();

    return result[0];
  },

  /**
   * Delete a soundscape
   */
  async deleteSoundscape(userId: string, soundscapeId: string): Promise<void> {
    await this.getSoundscapeById(userId, soundscapeId);

    await db
      .delete(soundscapes)
      .where(
        and(eq(soundscapes.id, soundscapeId), eq(soundscapes.userId, userId))
      );
  },
};
