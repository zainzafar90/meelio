import React, { useEffect, useState } from "react";

import { api } from "@/api";
import { ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";

interface WeatherData {
  temperature: {
    metric: {
      value: number;
      unit: string;
    };
  };
  weatherText: string;
  isDayTime: boolean;
  lastUpdated: Date;
}

export const WeatherDock: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const LOCATION_KEY = "328328";
        const response = await api.weather.getWeather({
          locationId: LOCATION_KEY,
        });

        if (!response.data) {
          throw new Error("Failed to fetch weather data");
        }
        const data = response.data;
        setWeatherData(data);
      } catch (err) {
        setError("Failed to fetch weather data");
        console.error("Weather fetch error:", err);
      }
    };

    fetchWeather();

    const interval = setInterval(fetchWeather, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div
        className={cn(
          "bg-gradient-to-b from-zinc-800 to-zinc-900",
          "flex size-12 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-zinc-900 shadow-lg"
        )}
      >
        <ShieldAlert className="h-4 w-4 text-red-400" />
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div
        className={cn(
          "bg-gradient-to-b from-zinc-800 to-zinc-900",
          "flex size-12 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-zinc-900 shadow-lg"
        )}
      >
        <Icons.spinner className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-zinc-800 to-zinc-900",
        "flex size-12 cursor-pointer flex-col overflow-hidden rounded-xl bg-zinc-900 shadow-lg"
      )}
      title={`${weatherData.temperature.metric.value}°${weatherData.temperature.metric.unit}`}
    >
      <div className="truncate bg-zinc-600 pt-0.5 text-center text-xxs font-bold uppercase text-white">
        {weatherData.temperature.metric.value}°
        {weatherData.temperature.metric.unit}
      </div>
      <div className="flex flex-grow items-center justify-center">
        <span className="flex flex-wrap text-balance text-center text-xs font-light text-white">
          {weatherData.weatherText}
        </span>
      </div>
    </div>
  );
};
