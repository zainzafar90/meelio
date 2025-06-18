import { AxiosResponse } from "axios";
import { axios } from "./axios";

interface CalendarAuthResponse {
  authUrl: string;
}

interface CalendarTokenStatus {
  hasToken: boolean;
  accessToken?: string | null;
  expiresAt?: string | null;
}

/**
 * Get Google Calendar authorization URL
 */
export function getCalendarAuthUrl(): Promise<AxiosResponse<CalendarAuthResponse>> {
  return axios.get("/v1/calendar/auth");
}

/**
 * Check if user has a calendar token
 */
export function getCalendarTokenStatus(): Promise<AxiosResponse<CalendarTokenStatus>> {
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