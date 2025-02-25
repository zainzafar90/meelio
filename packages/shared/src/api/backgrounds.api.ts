import { AxiosResponse } from "axios";
import type { Background } from "../lib/db/models";
import { axios } from "./axios";

export function getBackgrounds(): Promise<AxiosResponse<Background[]>> {
  return axios.get("/v1/backgrounds");
}

export function createBackground(
  background: Omit<
    Background,
    | "id"
    | "_syncStatus"
    | "_version"
    | "_lastModified"
    | "createdAt"
    | "updatedAt"
  >
): Promise<AxiosResponse<Background>> {
  return axios.post("/v1/backgrounds", background);
}

export function updateBackground(
  id: string,
  data: Partial<Background>
): Promise<AxiosResponse<Background>> {
  return axios.put(`/v1/backgrounds/${id}`, data);
}

export function deleteBackground(id: string): Promise<AxiosResponse<void>> {
  return axios.delete(`/v1/backgrounds/${id}`);
}
