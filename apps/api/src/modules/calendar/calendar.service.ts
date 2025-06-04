import { google } from "googleapis";
import { db } from "@/db";
import { calendarTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { config } from "@/config/config";

function getOAuthClient() {
  const redirect =
    config.env === "production"
      ? "https://api.meelio.io/v1/calendar/callback"
      : "/v1/calendar/callback";

  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    redirect,
  );
}

export async function generateAuthUrl(state: string) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    prompt: "consent",
    state,
  });
}

export async function storeToken(userId: string, code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token || !tokens.access_token) {
    throw new Error("Missing tokens");
  }
  await db
    .insert(calendarTokens)
    .values({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
    })
    .onConflictDoUpdate({
      target: calendarTokens.userId,
      set: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : new Date(),
      },
    });
}

export async function revokeToken(userId: string) {
  await db.delete(calendarTokens).where(eq(calendarTokens.userId, userId));
}

async function getValidCredentials(userId: string) {
  const record = await db.query.calendarTokens.findFirst({
    where: eq(calendarTokens.userId, userId),
  });
  if (!record) return null;

  const client = getOAuthClient();
  client.setCredentials({
    access_token: record.accessToken,
    refresh_token: record.refreshToken,
  });

  if (record.expiresAt < new Date()) {
    const { credentials } = await client.refreshAccessToken();
    await db
      .update(calendarTokens)
      .set({
        accessToken: credentials.access_token!,
        expiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(),
      })
      .where(eq(calendarTokens.userId, userId));
  }

  return client;
}

export async function getNextEvent(userId: string) {
  const client = await getValidCredentials(userId);
  if (!client) return null;

  const calendar = google.calendar({ version: "v3", auth: client });
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
}
