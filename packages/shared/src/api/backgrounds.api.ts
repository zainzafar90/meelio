import { AxiosResponse } from "axios";
import { Background } from "../lib/db/models";
import { axios } from "./axios";

export function getBackgrounds(): Promise<AxiosResponse<Background[]>> {
  return axios.get("/v1/backgrounds");
}

export function getBackground(id: string): Promise<AxiosResponse<Background>> {
  return axios.get(`/v1/backgrounds/${id}`);
}

export function createBackground(background: {
  type: "static" | "live";
  url: string;
  metadata: {
    name: string;
    category: string;
    tags: string[];
    thumbnailUrl: string;
  };
}): Promise<AxiosResponse<Background>> {
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

export function setSelectedBackground(
  backgroundId: string
): Promise<AxiosResponse<Background>> {
  return axios.post("/v1/backgrounds/selected", { backgroundId });
}

export function getRandomBackground(): Promise<AxiosResponse<Background>> {
  return axios.get("/v1/backgrounds/random");
}
