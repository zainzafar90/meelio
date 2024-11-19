import { axios } from "@/api/axios";

export function getWeather({ locationId }: { locationId: string }) {
  return axios.get(`/v1/weather?locationId=${locationId}`);
}
