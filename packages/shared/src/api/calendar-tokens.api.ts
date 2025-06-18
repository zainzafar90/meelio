export interface CalendarTokenPayload {
  token: string;
}

export interface CalendarTokenResponse {
  token: string;
}

export class CalendarApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarApiError";
  }
}

import { AxiosInstance } from "axios";
import { axios as defaultAxios } from "./axios";

/**
 * Persist Google Calendar token to backend
 */
export const saveCalendarToken = async (
  token: string,
  axiosInstance: AxiosInstance = defaultAxios,
): Promise<void> => {
  await axiosInstance.post<CalendarTokenResponse>("/v1/calendar-tokens", { token });
};

/**
 * Remove stored Google Calendar token
 */
export const deleteCalendarToken = async (
  axiosInstance: AxiosInstance = defaultAxios,
): Promise<void> => {
  await axiosInstance.delete("/v1/calendar-tokens");
};
