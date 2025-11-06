export interface WeatherData {
  temperature: {
    metric: {
      value: number;
      unit: string;
    };
    imperial?: {
      value: number;
      unit: string;
    };
  };
  weatherText: string;
  weatherIcon?: number;
  isDayTime: boolean;
  locationKey?: string;
  locationName?: string;
  lastUpdated: number;
}

export interface ForecastDay {
  date: string;
  temperature: {
    min: {
      metric: {
        value: number;
        unit: string;
      };
      imperial?: {
        value: number;
        unit: string;
      };
    };
    max: {
      metric: {
        value: number;
        unit: string;
      };
      imperial?: {
        value: number;
        unit: string;
      };
    };
  };
  day: {
    icon: number;
    iconPhrase: string;
    hasPrecipitation: boolean;
    precipitationType?: string;
    precipitationIntensity?: string;
  };
  night: {
    icon: number;
    iconPhrase: string;
    hasPrecipitation: boolean;
    precipitationType?: string;
    precipitationIntensity?: string;
  };
}

export interface WeatherForecast {
  locationKey: string;
  locationName: string;
  current: WeatherData;
  forecast: ForecastDay[];
  cachedAt: number;
}

