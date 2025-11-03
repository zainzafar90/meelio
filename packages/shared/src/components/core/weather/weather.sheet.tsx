import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { useDockStore } from "../../../stores/dock.store";
import { useWeatherStore } from "../../../stores/weather.store";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { useShallow } from "zustand/shallow";
import { Icons } from "../../../components/icons/icons";
import { RefreshCw, MapPin, Cloud } from "lucide-react";
import { cn } from "../../../lib/utils";

export function WeatherSheet() {
  const { t } = useTranslation();
  const { isWeatherVisible, toggleWeather } = useDockStore(
    useShallow((state) => ({
      isWeatherVisible: (state as any).isWeatherVisible ?? false,
      toggleWeather: (state as any).toggleWeather ?? (() => {}),
    }))
  );

  return (
    <Sheet open={isWeatherVisible} onOpenChange={toggleWeather}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl border-l border-white/10 bg-zinc-900 backdrop-blur-xl"
      >
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>
              {t("weather.title", { defaultValue: "Weather" })}
            </SheetTitle>
            <SheetDescription>
              {t("weather.description", {
                defaultValue: "Current weather and 5-day forecast",
              })}
            </SheetDescription>
          </SheetHeader>
        </VisuallyHidden>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {t("weather.title", { defaultValue: "Weather" })}
          </h2>
        </div>

        <WeatherContent />
      </SheetContent>
    </Sheet>
  );
}

const WeatherContent = () => {
  const { t } = useTranslation();
  const {
    current,
    forecast,
    locationName,
    isLoading,
    error,
    initializeStore,
    refreshWeather,
  } = useWeatherStore(
    useShallow((state) => ({
      current: state.current,
      forecast: state.forecast,
      locationName: state.locationName,
      isLoading: state.isLoading,
      error: state.error,
      initializeStore: state.initializeStore,
      refreshWeather: state.refreshWeather,
    }))
  );

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t("weather.today", { defaultValue: "Today" });
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return t("weather.tomorrow", { defaultValue: "Tomorrow" });
    }
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getWeatherIcon = (icon: number): string => {
    return `https://www.accuweather.com/assets/images/weather-icons/v2a/${icon}.svg`;
  };

  if (isLoading && !current) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Icons.spinner className="h-6 w-6 animate-spin text-white/60" />
      </div>
    );
  }

  if (error && !current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Cloud className="h-12 w-12 text-white/40" />
        <div className="text-lg text-white">{error}</div>
        <Button onClick={refreshWeather} variant="outline">
          {t("weather.retry", { defaultValue: "Retry" })}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshWeather}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          {t("weather.refresh", { defaultValue: "Refresh" })}
        </Button>
        {locationName && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <MapPin className="h-4 w-4" />
            {locationName}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {current && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="text-sm text-white/60 mb-4">
              {t("weather.current", { defaultValue: "Current" })}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {current.weatherIcon && (
                  <img
                    src={getWeatherIcon(current.weatherIcon)}
                    alt={current.weatherText}
                    className="h-16 w-16"
                  />
                )}
                <div>
                  <div className="text-4xl font-bold text-white">
                    {current.temperature.metric.value}°
                    {current.temperature.metric.unit}
                  </div>
                  <div className="text-sm text-white/80 mt-1">
                    {current.weatherText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {forecast.length > 0 && (
          <div>
            <div className="text-sm text-white/60 mb-4">
              {t("weather.forecast", { defaultValue: "5-Day Forecast" })}
            </div>
            <div className="space-y-2">
              {forecast.slice(0, 5).map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-sm font-medium text-white w-20">
                      {formatDate(day.date)}
                    </div>
                    {day.day.icon && (
                      <img
                        src={getWeatherIcon(day.day.icon)}
                        alt={day.day.iconPhrase}
                        className="h-8 w-8"
                      />
                    )}
                    <div className="text-sm text-white/80 flex-1">
                      {day.day.iconPhrase}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white">
                    <span className="text-white/60">
                      {day.temperature.min.metric.value}°
                    </span>
                    <span className="font-medium">
                      {day.temperature.max.metric.value}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!current && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center text-white/60">
            <Cloud className="h-12 w-12 text-white/20" />
            <div>
              {t("weather.empty", {
                defaultValue: "No weather data available",
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
