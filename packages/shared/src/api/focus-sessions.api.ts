import { AxiosResponse } from "axios";
import { BaseModel } from "../lib/db/models";
import { axios } from "./axios";

// Define the FocusSession interface extending BaseModel
export interface FocusSession extends BaseModel {
  userId: string;
  sessionStart: string;
  sessionEnd: string;
  duration: number; // duration in minutes
}

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
