import { relations } from "drizzle-orm";
import { pgTable, text, jsonb, index } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const weatherCache = pgTable(
  "weather_cache",
  {
    id,
    userId: text("user_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    weatherData: jsonb("weather_data"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_weather_cache_user_id").on(table.userId),
  })
);

export type WeatherCache = typeof weatherCache.$inferSelect;
export type WeatherCacheInsert = typeof weatherCache.$inferInsert;

export const weatherCacheRelations = relations(weatherCache, ({ one }) => ({
  user: one(users, {
    fields: [weatherCache.userId],
    references: [users.id],
  }),
}));
