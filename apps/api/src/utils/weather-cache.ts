interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface LocationSearchResult {
  key: string;
  localizedName: string;
  englishName: string;
  country: string;
  administrativeArea: string;
  displayName: string;
}

interface AccuWeatherLocation {
  Key: string;
  LocalizedName: string;
  EnglishName: string;
  Country: {
    ID: string;
    LocalizedName: string;
    EnglishName: string;
  };
  AdministrativeArea: {
    ID: string;
    LocalizedName: string;
    EnglishName: string;
  };
}

interface AccuWeatherCurrentCondition {
  LocalObservationDateTime: string;
  EpochTime: number;
  WeatherText: string;
  WeatherIcon: number;
  HasPrecipitation: boolean;
  PrecipitationType?: string;
  IsDayTime: boolean;
  Temperature: {
    Metric: {
      Value: number;
      Unit: string;
      UnitType: number;
    };
    Imperial: {
      Value: number;
      Unit: string;
      UnitType: number;
    };
  };
}

interface AccuWeatherForecastDay {
  Date: string;
  EpochDate: number;
  Temperature: {
    Minimum: {
      Value: number;
      Unit: string;
      UnitType: number;
    };
    Maximum: {
      Value: number;
      Unit: string;
      UnitType: number;
    };
  };
  Day: {
    Icon: number;
    IconPhrase: string;
    HasPrecipitation: boolean;
    PrecipitationType?: string;
    PrecipitationIntensity?: string;
  };
  Night: {
    Icon: number;
    IconPhrase: string;
    HasPrecipitation: boolean;
    PrecipitationType?: string;
    PrecipitationIntensity?: string;
  };
}

interface AccuWeatherForecastResponse {
  Headline: {
    EffectiveDate: string;
    EffectiveEpochDate: number;
    Severity: number;
    Text: string;
    Category: string;
    EndDate: string;
    EndEpochDate: number;
  };
  DailyForecasts: AccuWeatherForecastDay[];
}

const createWeatherCache = <T>(
  maxSize: number,
  defaultTTL: number,
  cacheName: string
) => {
  const cache = new Map<string, CacheEntry<T>>();

  const get = (key: string): T | null => {
    const entry = cache.get(key);

    if (!entry) {
      console.log(`[Weather Cache] ${cacheName}: MISS - ${key}`);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      console.log(`[Weather Cache] ${cacheName}: EXPIRED - ${key}`);
      return null;
    }

    cache.delete(key);
    cache.set(key, entry);

    const ageMinutes = Math.floor((Date.now() - entry.timestamp) / (1000 * 60));
    console.log(`[Weather Cache] ${cacheName}: HIT - ${key} (age: ${ageMinutes}m)`);
    return entry.data;
  };

  const set = (key: string, data: T, ttl?: number): void => {
    const now = Date.now();
    const expiresAt = now + (ttl || defaultTTL);

    if (cache.size >= maxSize && !cache.has(key)) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
        console.log(`[Weather Cache] ${cacheName}: EVICTED - ${firstKey} (size limit: ${maxSize})`);
      }
    }

    cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });

    const ttlMinutes = Math.floor((ttl || defaultTTL) / (1000 * 60));
    console.log(`[Weather Cache] ${cacheName}: SET - ${key} (TTL: ${ttlMinutes}m, size: ${cache.size}/${maxSize})`);
  };

  const cleanup = (): void => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiresAt) {
        cache.delete(key);
      }
    }
  };

  setInterval(cleanup, 60 * 1000);

  return { get, set };
};

const LOCATION_SEARCH_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_WEATHER_TTL = 24 * 60 * 60 * 1000; // 24 hours
const FORECAST_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const locationSearchCache = createWeatherCache<LocationSearchResult[]>(
  200,
  LOCATION_SEARCH_TTL,
  "LocationSearch"
);
export const locationInfoCache = createWeatherCache<AccuWeatherLocation>(
  200,
  LOCATION_SEARCH_TTL,
  "LocationInfo"
);
export const currentWeatherCache = createWeatherCache<AccuWeatherCurrentCondition>(
  200,
  CURRENT_WEATHER_TTL,
  "CurrentWeather"
);
export const forecastCache = createWeatherCache<AccuWeatherForecastResponse>(
  200,
  FORECAST_TTL,
  "Forecast"
);

export type {
  LocationSearchResult,
  AccuWeatherLocation,
  AccuWeatherCurrentCondition,
  AccuWeatherForecastResponse,
  AccuWeatherForecastDay,
};

