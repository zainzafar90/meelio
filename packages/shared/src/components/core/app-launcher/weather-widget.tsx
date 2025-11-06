import { useState } from "react";
import { useShallow } from "zustand/shallow";
import { Crown } from "lucide-react";

import { useWeatherStore } from "../../../stores/weather.store";
import { Icons } from "../../icons/icons";
import { PremiumFeature } from "../../common/premium-feature";

const getWeatherIcon = (icon: number): string => {
  return `https://www.accuweather.com/assets/images/weather-icons/v2a/${icon}.svg`;
};

const convertToFahrenheit = (celsius: number): number => {
  return (celsius * 9) / 5 + 32;
};

export const WeatherWidget = () => {
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");

  const {
    current: currentWeather,
    forecast,
    locationName,
    locationKey,
  } = useWeatherStore(
    useShallow((state) => ({
      current: state.current,
      forecast: state.forecast,
      locationName: state.locationName,
      locationKey: state.locationKey,
    }))
  );

  if (!locationKey || !currentWeather) {
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
    <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-blue-400/20 via-blue-500/15 to-blue-600/10 p-5 shadow-lg backdrop-blur-xl">
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
              <Icons.weather className="size-10 text-card-foreground drop-shadow-lg" />
            )}
          </div>
          <div className="flex items-start">
            <span className="text-5xl font-light text-card-foreground drop-shadow-lg">
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
                    ? "text-card-foreground"
                    : "text-muted-foreground hover:text-card-foreground/80"
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
                    ? "text-card-foreground"
                    : "text-muted-foreground hover:text-card-foreground/80"
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 min-w-0">
          <h3 className="text-sm font-semibold text-card-foreground truncate max-w-[120px]">
            {locationName}
          </h3>
          <p className="text-xs text-card-foreground/80 truncate max-w-[120px]">
            {currentWeather.weatherText}
          </p>
        </div>
      </div>

      {forecast.length > 0 && (
        <PremiumFeature
          requirePro={true}
          fallback={
            <div className="relative">
              <div className="relative">
                <div className="space-y-1.5 blur-[2px] pointer-events-none select-none">
                  {[1, 2, 3].map((day) => (
                    <div
                      key={day}
                      className="flex items-center justify-between rounded-lg bg-white/5 p-2 border border-white/10"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="text-xs text-card-foreground/40 w-12">
                          Day {day}
                        </div>
                        <div className="h-5 w-5 rounded-full bg-white/10" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-card-foreground/40">
                        <span>12°</span>
                        <span>24°</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-blue-700/20 backdrop-blur-[1px] rounded-lg">
                  <div className="text-center px-3 py-2">
                    <Crown className="h-5 w-5 text-amber-400 mx-auto mb-1.5" />
                    <p className="text-xs text-card-foreground/90 font-medium">
                      Upgrade for Forecast
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <div className="space-y-1.5">
            {forecast.slice(0, 3).map((day) => {
              const date = new Date(day.date);
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);

              let dayLabel = "";
              if (date.toDateString() === today.toDateString()) {
                dayLabel = "Today";
              } else if (date.toDateString() === tomorrow.toDateString()) {
                dayLabel = "Tomorrow";
              } else {
                dayLabel = date.toLocaleDateString("en-US", {
                  weekday: "short",
                });
              }

              return (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-2 border border-white/10"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="text-xs text-card-foreground w-12">
                      {dayLabel}
                    </div>
                    {day.day.icon && (
                      <img
                        src={getWeatherIcon(day.day.icon)}
                        alt={day.day.iconPhrase}
                        className="h-5 w-5"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-card-foreground">
                    <span className="text-card-foreground/60">
                      {Math.round(day.temperature.min.metric.value)}°
                    </span>
                    <span className="font-medium">
                      {Math.round(day.temperature.max.metric.value)}°
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </PremiumFeature>
      )}
    </div>
  );
};
