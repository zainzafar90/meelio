import { AxiosResponse } from "axios";

import { axios } from "./axios";

export function getWeather({
  locationId,
}: {
  locationId: string;
}): Promise<AxiosResponse> {
  return axios.get(`/v1/weather?locationId=${locationId}`);
}

export function getWeatherForecast({
  locationId,
}: {
  locationId: string;
}): Promise<AxiosResponse> {
  return axios.get(`/v1/weather/forecast?locationId=${locationId}`);
}

export function searchLocations({
  q,
}: {
  q: string;
}): Promise<AxiosResponse> {
  return axios.get(`/v1/weather/locations/search?q=${encodeURIComponent(q)}`);
}

export const weatherApi = {
  getWeather,
  getWeatherForecast,
  searchLocations,
};
