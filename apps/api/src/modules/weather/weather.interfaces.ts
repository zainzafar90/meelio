import { Document, Model } from "mongoose";

export interface IWeatherData {
  locationId: string;
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

export interface IWeatherDoc extends IWeatherData, Document {}

export interface IWeatherModel extends Model<IWeatherDoc> {
  findLatest(): Promise<IWeatherDoc | null>;
}
