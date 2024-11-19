import { IWeatherDoc } from "./weather.interfaces";
import Weather from "./weather.model";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";

const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY;

export const weatherService = {
  /**
   * Get current weather data
   * @returns {Promise<IWeatherDoc>}
   */
  getCurrentWeather: async (locationId: string): Promise<IWeatherDoc> => {
    await Weather.findOne({
      locationId: locationId,
    });

    try {
      const url = `http://dataservice.accuweather.com/currentconditions/v1/${locationId}?apikey=${ACCUWEATHER_API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new ApiError(
          httpStatus.SERVICE_UNAVAILABLE,
          "Weather service unavailable"
        );
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new ApiError(
          httpStatus.SERVICE_UNAVAILABLE,
          "Weather service unavailable or there's no data"
        );
      }

      const data0 = data[0];

      const weatherData = {
        locationId: locationId,
        temperature: {
          metric: {
            value: data0.Temperature.Metric.Value,
            unit: data0.Temperature.Metric.Unit,
          },
        },
        weatherText: data0.WeatherText,
        isDayTime: data0.IsDayTime,
        lastUpdated: new Date(),
      };

      const weather = await Weather.create(weatherData);
      return weather;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to fetch weather data"
      );
    }
  },
};
