import { create } from "zustand";
import {
    subscribeWithSelector,
    persist,
    createJSONStorage,
} from "zustand/middleware";
import { db } from "../lib/db/meelio.dexie";
import type { CachedWeather } from "../lib/db/models.dexie";
import { api } from "../api";
import type {
    WeatherData,
    ForecastDay,
    WeatherForecast,
} from "../types/weather.types";
import { generateUUID } from "../utils/common.utils";
import { useAuthStore } from "./auth.store";

interface WeatherState {
    current: WeatherData | null;
    forecast: ForecastDay[];
    locationKey: string | null;
    locationName: string | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: number | null;

    initializeStore: () => Promise<void>;
    loadFromLocal: () => Promise<void>;
    fetchWeather: (locationKey: string, locationName?: string) => Promise<void>;
    refreshWeather: () => Promise<void>;
    setLocation: (locationKey: string, locationName?: string) => void;
    startAutoRefresh: () => void;
    stopAutoRefresh: () => void;
}

const CACHE_DURATION = 3 * 60 * 60 * 1000;

let refreshInterval: NodeJS.Timeout | null = null;

const cacheWeather = async (
    weatherForecast: WeatherForecast
): Promise<void> => {
    const cached: CachedWeather = {
        id: generateUUID(),
        locationKey: weatherForecast.locationKey,
        locationName: weatherForecast.locationName,
        currentWeather: JSON.stringify(weatherForecast.current),
        forecast: JSON.stringify(weatherForecast.forecast),
        cachedAt: Date.now(),
    };

    await db.weather
        .where("locationKey")
        .equals(weatherForecast.locationKey)
        .delete();

    await db.weather.add(cached);
};

const loadFromCache = async (
    locationKey: string
): Promise<WeatherForecast | null> => {
    const cached = await db.weather
        .where("locationKey")
        .equals(locationKey)
        .first();

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.cachedAt > CACHE_DURATION) {
        await db.weather.where("locationKey").equals(locationKey).delete();
        return null;
    }

    return {
        locationKey: cached.locationKey,
        locationName: cached.locationName,
        current: JSON.parse(cached.currentWeather),
        forecast: JSON.parse(cached.forecast),
        cachedAt: cached.cachedAt,
    };
};

const shouldRefresh = (lastUpdated: number | null): boolean => {
    if (!lastUpdated) return true;
    return Date.now() - lastUpdated > CACHE_DURATION;
};

export const useWeatherStore = create<WeatherState>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                current: null,
                forecast: [],
                locationKey: null,
                locationName: null,
                isLoading: false,
                error: null,
                lastUpdated: null,

                initializeStore: async () => {
                    const state = get();
                    if (state.isLoading) return;

                    set({ isLoading: true, error: null });

                    try {
                        const authState = useAuthStore.getState();
                        const user = authState.user;
                        const accountLocationKey = user?.locationKey;
                        const accountLocationName = user?.locationName;

                        if (
                            accountLocationKey &&
                            accountLocationKey !== state.locationKey
                        ) {
                            set({
                                locationKey: accountLocationKey,
                                locationName: accountLocationName || null,
                            });
                        }

                        await get().loadFromLocal();

                        const currentState = get();

                        if (currentState.locationKey && shouldRefresh(currentState.lastUpdated)) {
                            await get().fetchWeather(
                                currentState.locationKey,
                                currentState.locationName || undefined
                            );
                        }

                        if (currentState.locationKey) {
                            get().startAutoRefresh();
                        }
                    } catch (error) {
                        console.error("Failed to initialize weather store:", error);
                        set({
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Failed to initialize weather",
                        });
                    } finally {
                        set({ isLoading: false });
                    }
                },

                loadFromLocal: async () => {
                    const state = get();
                    if (!state.locationKey) return;

                    try {
                        const cached = await loadFromCache(state.locationKey);
                        if (cached) {
                            set({
                                current: cached.current,
                                forecast: cached.forecast,
                                locationKey: cached.locationKey,
                                locationName: cached.locationName,
                                lastUpdated: cached.cachedAt,
                            });
                        }
                    } catch (error) {
                        console.error("Failed to load weather from cache:", error);
                    }
                },

                fetchWeather: async (locationKey: string, locationName?: string) => {
                    set({ isLoading: true, error: null });

                    try {
                        const currentResponse = await api.weather.getWeather({
                            locationId: locationKey,
                        });
                        const current = currentResponse.data as WeatherData;

                        const forecast = await (async (): Promise<ForecastDay[]> => {
                            try {
                                const forecastResponse = await api.weather.getWeatherForecast({
                                    locationId: locationKey,
                                });
                                return (forecastResponse.data?.DailyForecasts ||
                                    []) as ForecastDay[];
                            } catch (forecastError) {
                                console.warn(
                                    "Forecast endpoint not available, continuing with current weather only:",
                                    forecastError
                                );
                                return [];
                            }
                        })();

                        const weatherForecast: WeatherForecast = {
                            locationKey,
                            locationName: locationName || current.locationName || locationKey,
                            current: {
                                ...current,
                                lastUpdated: Date.now(),
                            },
                            forecast,
                            cachedAt: Date.now(),
                        };

                        await cacheWeather(weatherForecast);

                        set({
                            current: weatherForecast.current,
                            forecast: weatherForecast.forecast,
                            locationKey: weatherForecast.locationKey,
                            locationName: weatherForecast.locationName,
                            lastUpdated: weatherForecast.cachedAt,
                            isLoading: false,
                        });
                    } catch (error) {
                        console.error("Failed to fetch weather:", error);
                        set({
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Failed to fetch weather",
                            isLoading: false,
                        });
                    }
                },

                refreshWeather: async () => {
                    const state = get();
                    if (!state.locationKey) return;

                    await get().fetchWeather(
                        state.locationKey,
                        state.locationName || undefined
                    );
                },

                setLocation: (locationKey: string, locationName?: string) => {
                    set({ locationKey, locationName: locationName || null });
                    get().startAutoRefresh();
                },

                startAutoRefresh: () => {
                    if (refreshInterval) {
                        clearInterval(refreshInterval);
                    }

                    refreshInterval = setInterval(async () => {
                        const state = get();
                        if (shouldRefresh(state.lastUpdated) && state.locationKey) {
                            await get().refreshWeather();
                        }
                    }, CACHE_DURATION);
                },

                stopAutoRefresh: () => {
                    if (refreshInterval) {
                        clearInterval(refreshInterval);
                        refreshInterval = null;
                    }
                },
            }),
            {
                name: "meelio:local:weather",
                storage: createJSONStorage(() => localStorage),
                version: 1,
                partialize: (state) => ({
                    locationKey: state.locationKey,
                    locationName: state.locationName,
                }),
            }
        )
    ),

);
