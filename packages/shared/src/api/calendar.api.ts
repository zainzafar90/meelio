import { AxiosResponse } from "axios";
import { axios } from "./axios";

interface CalendarAuthResponse {
  authUrl: string;
}

export interface CalendarAccessToken {
  accessToken: string | null;
  expiresAt: number | null;
}

/**
 * Get Google Calendar authorization URL
 */
export function getCalendarAuthUrl(): Promise<
  AxiosResponse<CalendarAuthResponse>
> {
  return axios.get("/v1/calendar/auth");
}

/**
 * Check if user has a calendar token
 */
export function getCalendarToken(): Promise<
  AxiosResponse<CalendarAccessToken>
> {
  return axios.get("/v1/calendar/tokens");
}

/**
 * Save calendar token
 */
export function saveCalendarToken(
  accessToken: string,
  refreshToken: string,
  expiresAt: Date
): Promise<AxiosResponse> {
  return axios.post("/v1/calendar/tokens", {
    accessToken,
    refreshToken,
    expiresAt,
  });
}

/**
 * Delete calendar token
 */
export function deleteCalendarToken(): Promise<AxiosResponse> {
  return axios.delete("/v1/calendar/tokens");
}

/**
 * Get a fresh access token from the server
 */
export async function fetchCalendarAccessToken(): Promise<CalendarAccessToken> {
  const res = await getCalendarToken();
  const { accessToken, expiresAt } = res.data;
  if (!accessToken || !expiresAt) {
    throw new Error("Missing calendar token");
  }
  return {
    accessToken,
    expiresAt: new Date(expiresAt).getTime(),
  };
}
