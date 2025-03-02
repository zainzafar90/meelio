import { AxiosResponse } from "axios";
import { FocusSession } from "../lib/db/models.dexie";
import { axios } from "./axios";

export function getFocusSessions(): Promise<AxiosResponse<FocusSession[]>> {
  return axios.get("/v1/focus-sessions");
}

export function getFocusSession(
  id: string
): Promise<AxiosResponse<FocusSession>> {
  return axios.get(`/v1/focus-sessions/${id}`);
}

export function createFocusSession(focusSession: {
  sessionStart: string;
  sessionEnd: string;
  duration: number;
}): Promise<AxiosResponse<FocusSession>> {
  return axios.post("/v1/focus-sessions", focusSession);
}

export function updateFocusSession(
  id: string,
  data: Partial<FocusSession>
): Promise<AxiosResponse<FocusSession>> {
  return axios.patch(`/v1/focus-sessions/${id}`, data);
}

export function deleteFocusSession(id: string): Promise<AxiosResponse<void>> {
  return axios.delete(`/v1/focus-sessions/${id}`);
}
