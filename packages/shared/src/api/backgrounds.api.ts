import { AxiosResponse } from "axios";
import { Backgrounds } from "../lib/db/models.dexie";
import { axios } from "./axios";

/**
 * Fetch all backgrounds for the current user
 * This will include default backgrounds and any new backgrounds the user hasn't seen yet
 */
export function getBackgrounds(): Promise<AxiosResponse<Backgrounds[]>> {
  return axios.get("/v1/backgrounds");
}

/**
 * Set a background as the selected background for the current user
 * @param backgroundId The ID of the background to set as selected
 */
export function setSelectedBackground(
  backgroundId: string
): Promise<
  AxiosResponse<{ backgrounds: Backgrounds[]; selectedBackgroundId: string }>
> {
  return axios.post("/v1/backgrounds/selected", { backgroundId });
}
