import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";
import { config } from "@/config/config";

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

interface AccuWeatherCurrentResponse {
  [key: number]: AccuWeatherCurrentCondition;
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

interface AccuWeatherLocationSearchResult extends AccuWeatherLocation {
  Type: string;
  Rank: number;
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

const ACCUWEATHER_BASE_URL = "http://dataservice.accuweather.com";

const getLocationInfo = async (locationKey: string): Promise<AccuWeatherLocation> => {
  if (!config.accuWeather.apiKey) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "Weather service is not configured. Please configure ACCUWEATHER_API_KEY.");
  }

  const url = `${ACCUWEATHER_BASE_URL}/locations/v1/${locationKey}?apikey=${config.accuWeather.apiKey}&language=en-us&details=false`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError(httpStatus.NOT_FOUND, `Location key "${locationKey}" not found`);
      }
      throw new ApiError(httpStatus.BAD_GATEWAY, "AccuWeather service unavailable");
    }

    const data = (await response.json()) as AccuWeatherLocation;
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch location info");
  }
};

const getCurrentConditions = async (locationKey: string): Promise<AccuWeatherCurrentCondition> => {
  if (!config.accuWeather.apiKey) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "Weather service is not configured. Please configure ACCUWEATHER_API_KEY.");
  }

  const url = `${ACCUWEATHER_BASE_URL}/currentconditions/v1/${locationKey}?apikey=${config.accuWeather.apiKey}&language=en-us&details=false`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorMessage = errorText || "AccuWeather service unavailable";

      if (response.status === 401 || response.status === 403) {
        const enhancedMessage = errorMessage && errorMessage !== "AccuWeather service unavailable"
          ? `Invalid AccuWeather API key: ${errorMessage}. Please verify your ACCUWEATHER_API_KEY in apps/api/.env and restart the server.`
          : "Invalid AccuWeather API key. Please verify your ACCUWEATHER_API_KEY in apps/api/.env and restart the server.";
        throw new ApiError(httpStatus.UNAUTHORIZED, enhancedMessage);
      }
      if (response.status === 404) {
        throw new ApiError(httpStatus.NOT_FOUND, `Location key "${locationKey}" not found`);
      }
      if (response.status === 503 || response.status === 502) {
        throw new ApiError(httpStatus.BAD_GATEWAY, "AccuWeather service is temporarily unavailable. Please try again later.");
      }
      throw new ApiError(httpStatus.BAD_GATEWAY, `AccuWeather API error (${response.status}): ${errorMessage}`);
    }

    const data = (await response.json()) as AccuWeatherCurrentCondition[];

    if (!data || data.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "No current conditions found");
    }

    return data[0];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch current conditions");
  }
};

const getForecast = async (locationKey: string): Promise<AccuWeatherForecastResponse> => {
  if (!config.accuWeather.apiKey) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "Weather service is not configured. Please configure ACCUWEATHER_API_KEY.");
  }

  if (config.accuWeather.apiKey.length < 20) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid AccuWeather API key format. API keys should be at least 20 characters long.");
  }

  const url = `${ACCUWEATHER_BASE_URL}/forecasts/v1/daily/5day/${locationKey}?apikey=${config.accuWeather.apiKey}&language=en-us&details=false&metric=true`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorMessage = errorText || "AccuWeather service unavailable";

      if (response.status === 401 || response.status === 403) {
        const enhancedMessage = errorMessage && errorMessage !== "AccuWeather service unavailable"
          ? `Invalid AccuWeather API key: ${errorMessage}. Please verify your ACCUWEATHER_API_KEY in apps/api/.env and restart the server.`
          : "Invalid AccuWeather API key. Please verify your ACCUWEATHER_API_KEY in apps/api/.env and restart the server.";
        throw new ApiError(httpStatus.UNAUTHORIZED, enhancedMessage);
      }
      if (response.status === 404) {
        throw new ApiError(httpStatus.NOT_FOUND, `Location key "${locationKey}" not found`);
      }
      if (response.status === 503 || response.status === 502) {
        throw new ApiError(httpStatus.BAD_GATEWAY, "AccuWeather service is temporarily unavailable. Please try again later.");
      }
      throw new ApiError(httpStatus.BAD_GATEWAY, `AccuWeather API error (${response.status}): ${errorMessage}`);
    }

    const data = (await response.json()) as AccuWeatherForecastResponse;
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch forecast");
  }
};

export const weatherService = {
  async getCurrentWeather(locationId: string) {
    const [locationInfo, currentCondition] = await Promise.all([
      getLocationInfo(locationId),
      getCurrentConditions(locationId),
    ]);

    return {
      temperature: {
        metric: {
          value: Math.round(currentCondition.Temperature.Metric.Value),
          unit: currentCondition.Temperature.Metric.Unit,
        },
        imperial: {
          value: Math.round(currentCondition.Temperature.Imperial.Value),
          unit: currentCondition.Temperature.Imperial.Unit,
        },
      },
      weatherText: currentCondition.WeatherText,
      weatherIcon: currentCondition.WeatherIcon,
      isDayTime: currentCondition.IsDayTime,
      locationKey: locationId,
      locationName: locationInfo.LocalizedName || locationInfo.EnglishName,
      lastUpdated: Date.now(),
    };
  },

  async getWeatherForecast(locationId: string) {
    const [locationInfo, forecastData] = await Promise.all([
      getLocationInfo(locationId),
      getForecast(locationId),
    ]);

    const forecast = forecastData.DailyForecasts.map((day) => ({
      date: day.Date,
      temperature: {
        min: {
          metric: {
            value: Math.round(day.Temperature.Minimum.Value),
            unit: day.Temperature.Minimum.Unit,
          },
          imperial: {
            value: Math.round(day.Temperature.Minimum.Value * 9 / 5 + 32),
            unit: "F",
          },
        },
        max: {
          metric: {
            value: Math.round(day.Temperature.Maximum.Value),
            unit: day.Temperature.Maximum.Unit,
          },
          imperial: {
            value: Math.round(day.Temperature.Maximum.Value * 9 / 5 + 32),
            unit: "F",
          },
        },
      },
      day: {
        icon: day.Day.Icon,
        iconPhrase: day.Day.IconPhrase,
        hasPrecipitation: day.Day.HasPrecipitation,
        precipitationType: day.Day.PrecipitationType,
        precipitationIntensity: day.Day.PrecipitationIntensity,
      },
      night: {
        icon: day.Night.Icon,
        iconPhrase: day.Night.IconPhrase,
        hasPrecipitation: day.Night.HasPrecipitation,
        precipitationType: day.Night.PrecipitationType,
        precipitationIntensity: day.Night.PrecipitationIntensity,
      },
    }));

    return {
      DailyForecasts: forecast,
      locationKey: locationId,
      locationName: locationInfo.LocalizedName || locationInfo.EnglishName,
    };
  },

  async searchLocations(query: string) {
    if (!config.accuWeather.apiKey) {
      throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "Weather service is not configured. Please configure ACCUWEATHER_API_KEY.");
    }

    if (!query || query.trim().length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Search query is required");
    }

    const url = `${ACCUWEATHER_BASE_URL}/locations/v1/cities/search?apikey=${config.accuWeather.apiKey}&q=${encodeURIComponent(query)}&language=en-us&details=false`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const errorMessage = errorText || "AccuWeather service unavailable";

        if (response.status === 401 || response.status === 403) {
          const enhancedMessage = errorMessage && errorMessage !== "AccuWeather service unavailable"
            ? `Invalid AccuWeather API key: ${errorMessage}. Please verify your ACCUWEATHER_API_KEY in apps/api/.env and restart the server.`
            : "Invalid AccuWeather API key. Please verify your ACCUWEATHER_API_KEY in apps/api/.env and restart the server.";
          throw new ApiError(httpStatus.UNAUTHORIZED, enhancedMessage);
        }
        if (response.status === 503 || response.status === 502) {
          throw new ApiError(httpStatus.BAD_GATEWAY, "AccuWeather service is temporarily unavailable. Please try again later.");
        }
        throw new ApiError(httpStatus.BAD_GATEWAY, `AccuWeather API error (${response.status}): ${errorMessage}`);
      }

      const data = (await response.json()) as AccuWeatherLocationSearchResult[];

      return data.map((location) => ({
        key: location.Key,
        localizedName: location.LocalizedName,
        englishName: location.EnglishName,
        country: location.Country.EnglishName,
        administrativeArea: location.AdministrativeArea.EnglishName,
        displayName: `${location.LocalizedName}, ${location.AdministrativeArea.EnglishName}, ${location.Country.EnglishName}`,
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to search locations");
    }
  },
};
