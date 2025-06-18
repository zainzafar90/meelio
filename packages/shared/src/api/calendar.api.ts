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
  return axios.get("/v1/calendar-tokens");
}