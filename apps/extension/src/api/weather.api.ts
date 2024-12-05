import { AxiosResponse } from "axios";

import { axios } from "@/api/axios";

export function getWeather({
  locationId,
}: {
  locationId: string;
}): Promise<AxiosResponse> {
  return axios.get(`/v1/weather?locationId=${locationId}`);
}
