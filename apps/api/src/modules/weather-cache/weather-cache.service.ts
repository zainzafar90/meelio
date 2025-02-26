import { db } from "@/db";
import { weatherCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  WeatherCache,
  WeatherCacheInsert,
} from "@/db/schema/weather-cache.schema";

export const weatherCacheService = {
  /**
   * Get weather cache for a user
   */
  getWeatherCache: async (userId: string): Promise<WeatherCache | null> => {
    const result = await db
      .select()
      .from(weatherCache)
      .where(eq(weatherCache.userId, userId));

    if (result.length === 0) {
      return null;
    }

    return result[0];
  },

  /**
   * Create or update weather cache for a user
   */
  createOrUpdateWeatherCache: async (
    userId: string,
    data: Record<string, any>
  ): Promise<WeatherCache> => {
    // Check if weather cache already exists
    const existingCache = await weatherCacheService.getWeatherCache(userId);

    if (existingCache) {
      // Update existing cache
      const result = await db
        .update(weatherCache)
        .set({
          weatherData: data.weatherData,
          updatedAt: new Date(),
        } as WeatherCache)
        .where(eq(weatherCache.userId, userId))
        .returning();

      return result[0];
    } else {
      // Create new cache
      const result = await db
        .insert(weatherCache)
        .values({
          userId,
          weatherData: data.weatherData,
        } as WeatherCacheInsert)
        .returning();

      return result[0];
    }
  },
};
