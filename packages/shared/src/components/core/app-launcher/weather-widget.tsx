import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { useWeatherStore } from "../../../stores/weather.store";
import { Icons } from "../../icons/icons";

const getWeatherIcon = (icon: number): string => {
  return `https://www.accuweather.com/assets/images/weather-icons/v2a/${icon}.svg`;
};

const formatForecastDay = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
  });
};

const convertToFahrenheit = (celsius: number): number => {
  return (celsius * 9) / 5 + 32;
};

export const WeatherWidget = () => {
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");

  const {
    current: currentWeather,
    locationName,
    forecast,
    initializeStore,
  } = useWeatherStore(
    useShallow((state) => ({
      current: state.current,
      locationName: state.locationName,
      forecast: state.forecast,
      initializeStore: state.initializeStore,
    }))
  );

  useEffect(() => {
    if (!currentWeather) {
      initializeStore();
    }
  }, [currentWeather, initializeStore]);

  if (!currentWeather) {
    return null;
  }

  const displayTemp =
    tempUnit === "C"
      ? Math.round(currentWeather.temperature.metric.value)
      : Math.round(
          currentWeather.temperature.imperial?.value ||
            convertToFahrenheit(currentWeather.temperature.metric.value)
        );

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-400/25 via-blue-500/20 to-blue-600/15 p-5 shadow-lg backdrop-blur-xl">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            {currentWeather.weatherIcon ? (
              <img
                src={getWeatherIcon(currentWeather.weatherIcon)}
                alt={currentWeather.weatherText}
                className="size-10 drop-shadow-lg"
              />
            ) : (
              <Icons.weather className="size-10 text-white/90 drop-shadow-lg" />
            )}
          </div>
          <div className="flex items-start">
            <span className="text-5xl font-light text-white drop-shadow-lg">
              {displayTemp}
            </span>
            <div className="mt-1 flex flex-col">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempUnit("C");
                }}
                className={`text-sm font-medium transition-colors ${
                  tempUnit === "C"
                    ? "text-white"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                °C
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempUnit("F");
                }}
                className={`text-sm transition-colors ${
                  tempUnit === "F"
                    ? "text-white"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate max-w-[120px]">
            {locationName}
          </h3>
          <p className="text-xs text-white/80 truncate max-w-[120px]">
            {currentWeather.weatherText}
          </p>
        </div>
      </div>

      {forecast.length > 0 && (
        <div className="mt-4 flex w-full items-center justify-between gap-2 overflow-x-auto rounded-lg bg-black/20 py-4">
          {forecast.slice(0, 5).map((day) => (
            <div
              key={day.date}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <p className="text-[10px] font-medium text-white/70">
                {formatForecastDay(day.date)}
              </p>

              {day.day?.icon && (
                <img
                  src={getWeatherIcon(day.day.icon)}
                  alt={day.day.iconPhrase}
                  className="size-8"
                />
              )}

              {tempUnit === "C" ? (
                <>
                  <p className="text-[10px] font-medium text-white/70">
                    {day.temperature.min.metric.value}°
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-medium text-white/70">
                    {day.temperature.min.imperial.value}°F
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
