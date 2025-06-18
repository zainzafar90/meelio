import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";

import {
  calendarTokens,
  CalendarToken,
  CalendarTokenInsert,
} from "@/db/schema";

export interface CalendarTokenService {
  saveToken(userId: string, token: string): Promise<CalendarToken>;
  deleteToken(userId: string): Promise<void>;
}

export const buildCalendarTokenService = (
  db: NodePgDatabase,
): CalendarTokenService => {
  const saveToken = async (
    userId: string,
    token: string,
  ): Promise<CalendarToken> => {
    const existing = await db.query.calendarTokens.findFirst({
      where: eq(calendarTokens.userId, userId),
    });

    if (existing) {
      const [updated] = await db
        .update(calendarTokens)
        .set({ token })
        .where(eq(calendarTokens.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(calendarTokens)
      .values({ userId, token } as CalendarTokenInsert)
      .returning();
    return created;
  };

  const deleteToken = async (userId: string): Promise<void> => {
    await db.delete(calendarTokens).where(eq(calendarTokens.userId, userId));
  };

  return { saveToken, deleteToken };
};
