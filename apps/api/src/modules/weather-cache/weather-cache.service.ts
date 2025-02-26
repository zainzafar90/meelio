import { db } from "@/db";
import { weatherCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import { WeatherCache } from "@/db/schema/weather-cache.schema";
/**
 * Get weather cache for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object|null>} The weather cache or null if not found
 */
export const getWeatherCache = async (userId: string) => {
  const result = await db
    .select()
    .from(weatherCache)
    .where(eq(weatherCache.userId, userId));

  if (result.length === 0) {
    return null;
  }

  return result[0];
};

/**
 * Create or update weather cache for a user
 * @param {string} userId - The user ID
 * @param {object} data - The weather cache data
 * @returns {Promise<object>} The created or updated weather cache
 */
export const createOrUpdateWeatherCache = async (userId: string, data: any) => {
  // Check if weather cache already exists
  const existingCache = await getWeatherCache(userId);

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
      } as WeatherCache)
      .returning();

    return result[0];
  }
};
