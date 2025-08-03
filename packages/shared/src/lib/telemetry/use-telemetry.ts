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
      console.debug(event, properties);
    },

    identify: (id: string) => {
      console.debug(id);
    },

    pageView: () => {
      console.debug(TelemetryEvent.PageView);
    },

    soundPlayed: (sound: Sound) => {
      console.debug(TelemetryEvent.SoundPlayed, { sound });
    },

    soundStopped: (sound: Sound) => {
      console.debug(TelemetryEvent.SoundStopped, { sound });
    },

    categoryPlayed: (category: string) => {
      console.debug(TelemetryEvent.CategoryPlayed, { category });
    },

    categoryStopped: (category: string) => {
      console.debug(TelemetryEvent.CategoryStopped, { category });
    },
  };
};
