import { Sound } from "../../types/sound";

export enum TelemetryEvent {
  PageView = "Page View",
  SoundPlayed = "Sound Played",
  SoundStopped = "Sound Stopped",
  CategoryPlayed = "Category Played",
  CategoryStopped = "Category Stopped",
}

export const useTelemetry = () => {
  return {
    track: (event: string, properties?: Record<string, unknown>) => {
      console.log(event, properties);
    },

    identify: (id: string) => {
      console.log(id);
    },

    pageView: () => {
      console.log(TelemetryEvent.PageView);
    },

    soundPlayed: (sound: Sound) => {
      console.log(TelemetryEvent.SoundPlayed, { sound });
    },

    soundStopped: (sound: Sound) => {
      console.log(TelemetryEvent.SoundStopped, { sound });
    },

    categoryPlayed: (category: string) => {
      console.log(TelemetryEvent.CategoryPlayed, { category });
    },

    categoryStopped: (category: string) => {
      console.log(TelemetryEvent.CategoryStopped, { category });
    },
  };
};
