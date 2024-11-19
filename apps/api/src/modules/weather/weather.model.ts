import mongoose from "mongoose";
import { IWeatherDoc, IWeatherModel } from "./weather.interfaces";

const weatherSchema = new mongoose.Schema<IWeatherDoc>(
  {
    locationId: {
      type: String,
      required: true,
    },
    temperature: {
      metric: {
        value: {
          type: Number,
          required: true,
        },
        unit: {
          type: String,
          required: true,
        },
      },
    },
    weatherText: {
      type: String,
      required: true,
    },
    isDayTime: {
      type: Boolean,
      required: true,
    },
    lastUpdated: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

weatherSchema.statics.findLatest =
  async function (): Promise<IWeatherDoc | null> {
    return this.findOne().sort({ lastUpdated: -1 }).exec();
  };

const Weather = mongoose.model<IWeatherDoc, IWeatherModel>(
  "Weather",
  weatherSchema
);

export default Weather;
