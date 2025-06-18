import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

import {
  calendarTokens,
  CalendarToken,
  CalendarTokenInsert,
} from "@/db/schema";
import * as schema from "@/db/schema";
import { config } from "@/config/config";

export interface CalendarTokenService {
  getToken(userId: string): Promise<CalendarToken | null>;
  getValidToken(userId: string): Promise<CalendarToken | null>;
  saveToken(userId: string, accessToken: string, refreshToken: string, expiresAt: Date): Promise<CalendarToken>;
  deleteToken(userId: string): Promise<void>;
}

/**
 * Get configured OAuth2 client
 */
function getOAuthClient() {
  const redirect =
    config.env === "production"
      ? "https://api.meelio.io/v1/calendar/callback"
      : `http://localhost:${config.port}/v1/calendar/callback`;

  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    redirect,
  );
}

export const buildCalendarTokenService = (
  db: NodePgDatabase<typeof schema>,
): CalendarTokenService => {
  const getToken = async (userId: string): Promise<CalendarToken | null> => {
    const token = await db.query.calendarTokens.findFirst({
      where: eq(calendarTokens.userId, userId),
    });
    return token || null;
  };

  const getValidToken = async (userId: string): Promise<CalendarToken | null> => {
    const record = await db.query.calendarTokens.findFirst({
      where: eq(calendarTokens.userId, userId),
    });
    
    if (!record) return null;

    // Check if token is expired
    if (record.expiresAt > new Date()) {
      return record;
    }

    // Token is expired, refresh it
    try {
      const client = getOAuthClient();
      client.setCredentials({
        access_token: record.accessToken,
        refresh_token: record.refreshToken,
      });

      const { credentials } = await client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error("Failed to refresh access token");
      }

      // Update the token in database
      const [updated] = await db
        .update(calendarTokens)
        .set({
          accessToken: credentials.access_token,
          expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600000), // 1 hour default
        })
        .where(eq(calendarTokens.userId, userId))
        .returning();

      return updated;
    } catch (error) {
      console.error("Error refreshing calendar token:", error);
      return null;
    }
  };

  const saveToken = async (
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<CalendarToken> => {
    const existing = await db.query.calendarTokens.findFirst({
      where: eq(calendarTokens.userId, userId),
    });

    if (existing) {
      const [updated] = await db
        .update(calendarTokens)
        .set({ accessToken, refreshToken, expiresAt })
        .where(eq(calendarTokens.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(calendarTokens)
      .values({ userId, accessToken, refreshToken, expiresAt } as CalendarTokenInsert)
      .returning();
    return created;
  };

  const deleteToken = async (userId: string): Promise<void> => {
    await db.delete(calendarTokens).where(eq(calendarTokens.userId, userId));
  };

  return { getToken, getValidToken, saveToken, deleteToken };
};
