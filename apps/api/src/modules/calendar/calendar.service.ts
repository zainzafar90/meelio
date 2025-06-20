import { eq } from "drizzle-orm";
import { google } from "googleapis";

import { calendar, Calendar, CalendarInsert } from "@/db/schema";
import { db } from "@/db";
import { config } from "@/config/config";

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
    redirect
  );
}

export const calendarService = {
  /**
   * Get calendar token for user
   */
  async getToken(userId: string): Promise<Calendar | null> {
    const token = await db.query.calendar.findFirst({
      where: eq(calendar.userId, userId),
    });
    return token || null;
  },

  /**
   * Get valid calendar token, refreshing if expired
   */
  async getValidToken(userId: string): Promise<Calendar | null> {
    const record = await db.query.calendar.findFirst({
      where: eq(calendar.userId, userId),
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
        .update(calendar)
        .set({
          accessToken: credentials.access_token,
          expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600000), // 1 hour default
        })
        .where(eq(calendar.userId, userId))
        .returning();

      return updated;
    } catch (error) {
      console.error("Error refreshing calendar token:", error);
      return null;
    }
  },

  /**
   * Save calendar token for user
   */
  async saveToken(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<Calendar> {
    const existing = await db.query.calendar.findFirst({
      where: eq(calendar.userId, userId),
    });

    if (existing) {
      const [updated] = await db
        .update(calendar)
        .set({ accessToken, refreshToken, expiresAt })
        .where(eq(calendar.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(calendar)
      .values({
        userId,
        accessToken,
        refreshToken,
        expiresAt,
      } as CalendarInsert)
      .returning();
    return created;
  },

  /**
   * Delete calendar token for user
   */
  async deleteToken(userId: string): Promise<void> {
    await db.delete(calendar).where(eq(calendar.userId, userId));
  },

  /**
   * Generate Google Calendar authorization URL
   */
  async generateAuthUrl(state: string): Promise<string> {
    const client = getOAuthClient();
    return client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.readonly"],
      prompt: "consent",
      state,
    });
  },

  /**
   * Store OAuth tokens after successful authorization
   */
  async storeToken(userId: string, code: string): Promise<void> {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token || !tokens.access_token) {
      throw new Error("Missing tokens from Google OAuth response");
    }

    await calendarService.saveToken(
      userId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date ? new Date(tokens.expiry_date) : new Date()
    );
  },

  /**
   * Get next calendar event for user
   */
  async getNextEvent(userId: string) {
    const token = await calendarService.getValidToken(userId);
    if (!token) return null;

    const calendar = google.calendar({ version: "v3", auth: getOAuthClient() });

    // Set credentials for this request
    const client = getOAuthClient();
    client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
    });

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 1,
      singleEvents: true,
      orderBy: "startTime",
    });

    const event = res.data.items?.[0];
    if (!event || !event.start?.dateTime) return null;

    return {
      summary: event.summary || "",
      start: event.start.dateTime,
    };
  },
};
