import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { useDockStore } from "../../../stores/dock.store";
import { useWeatherStore } from "../../../stores/weather.store";
import { useAuthStore } from "../../../stores/auth.store";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { useShallow } from "zustand/shallow";
import { Icons } from "../../../components/icons/icons";
import { RefreshCw, MapPin, Cloud, Search, Settings, Crown } from "lucide-react";
import { cn } from "../../../lib/utils";
import { api } from "../../../api";
import { toast } from "sonner";
import { PremiumFeature } from "../../common/premium-feature";

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
    locationKey,
    isLoading,
    error,
    initializeStore,
    refreshWeather,
    setLocation,
  } = useWeatherStore(
    useShallow((state) => ({
      current: state.current,
      forecast: state.forecast,
      locationName: state.locationName,
      locationKey: state.locationKey,
      isLoading: state.isLoading,
      error: state.error,
      initializeStore: state.initializeStore,
      refreshWeather: state.refreshWeather,
      setLocation: state.setLocation,
    }))
  );

  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.weather.searchLocations({ q: searchQuery });
        setSearchResults(response.data || []);
      } catch (error: any) {
        toast.error(t("weather.search-error", { defaultValue: "Failed to search locations" }), {
          description: error?.response?.data?.message || error?.message,
        });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, t]);

  const handleSelectLocation = async (location: { key: string; displayName: string }) => {
    setIsSaving(true);
    try {
      await api.settings.settingsApi.updateWeatherSettings({
        locationKey: location.key,
        locationName: location.displayName,
      });

      setLocation(location.key, location.displayName);
      
      const updatedUser = {
        ...user,
        settings: {
          ...user?.settings,
          weather: {
            locationKey: location.key,
            locationName: location.displayName,
          },
        },
        locationKey: location.key,
        locationName: location.displayName,
      };
      useAuthStore.getState().authenticate(updatedUser as any);

      await refreshWeather();
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);

      toast.success(t("weather.location-saved", { defaultValue: "Location saved successfully" }));
    } catch (error: any) {
      toast.error(t("weather.save-error", { defaultValue: "Failed to save location" }), {
        description: error?.response?.data?.message || error?.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

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
      <div className="flex items-center justify-between border-b border-white/10 p-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {locationName ? locationName : t("weather.set-location", { defaultValue: "Set Location" })}
        </Button>
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
      </div>

      {isSearchOpen && (
        <div className="border-b border-white/10 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            {isSearching && (
              <Icons.spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white/40" />
            )}
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("weather.search-placeholder", { defaultValue: "Search for a city..." })}
              className="pl-9 pr-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((location) => (
                <Button
                  key={location.key}
                  variant="ghost"
                  onClick={() => handleSelectLocation(location)}
                  disabled={isSaving}
                  className="w-full justify-start text-left text-white/80 hover:text-white hover:bg-white/10"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {location.displayName}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

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
          <PremiumFeature
            requirePro={true}
            fallback={
              <div className="relative">
                <div className="text-sm text-white/60 mb-4 flex items-center justify-between">
                  <span>{t("weather.forecast", { defaultValue: "5-Day Forecast" })}</span>
                  <Crown className="h-4 w-4 text-amber-400" />
                </div>
                <div className="relative">
                  <div className="space-y-2 blur-sm pointer-events-none select-none">
                    {[1, 2, 3, 4, 5].map((day) => (
                      <div
                        key={day}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-sm font-medium text-white/60 w-20">
                            Day {day}
                          </div>
                          <div className="h-8 w-8 rounded-full bg-white/10" />
                          <div className="text-sm text-white/60 flex-1">
                            Weather conditions
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>12°</span>
                          <span className="font-medium">24°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 backdrop-blur-[2px] rounded-lg">
                    <div className="text-center px-6 py-4">
                      <Crown className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                      <p className="text-white font-medium mb-1">
                        {t("weather.forecast-pro-title", { defaultValue: "5-Day Forecast" })}
                      </p>
                      <p className="text-sm text-white/60">
                        {t("weather.forecast-pro", { defaultValue: "Upgrade to Pro to unlock detailed weather forecasts" })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
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
          </PremiumFeature>
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
