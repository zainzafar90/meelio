import { AxiosResponse } from "axios";
import { Backgrounds } from "../lib/db/models.dexie";
import { axios } from "./axios";

export function getBackgrounds(): Promise<AxiosResponse<Backgrounds[]>> {
  return axios.get("/v1/backgrounds");
}

export function getBackground(id: string): Promise<AxiosResponse<Backgrounds>> {
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
}): Promise<AxiosResponse<Backgrounds>> {
  return axios.post("/v1/backgrounds", background);
}

export function updateBackground(
  id: string,
  data: Partial<Backgrounds>
): Promise<AxiosResponse<Backgrounds>> {
  return axios.put(`/v1/backgrounds/${id}`, data);
}

export function deleteBackground(id: string): Promise<AxiosResponse<void>> {
  return axios.delete(`/v1/backgrounds/${id}`);
}

export function setSelectedBackground(
  backgroundId: string
): Promise<
  AxiosResponse<{ backgrounds: Backgrounds[]; selectedBackgroundId: string }>
> {
  return axios.post("/v1/backgrounds/selected", { backgroundId });
}

export function getRandomBackground(): Promise<AxiosResponse<Backgrounds>> {
  return axios.get("/v1/backgrounds/random");
}
