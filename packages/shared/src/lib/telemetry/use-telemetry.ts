import { usePostHog } from "posthog-js/react";
import { Sound } from "../../types/sound";

export enum TelemetryEvent {
  PageView = "Page View",
  SoundPlayed = "Sound Played",
  SoundStopped = "Sound Stopped",
  CategoryPlayed = "Category Played",
  CategoryStopped = "Category Stopped",
}

export const useTelemetry = () => {
  const posthog = usePostHog();

  return {
    track: (event: string, properties?: Record<string, unknown>) => {
      posthog?.capture(event, properties);
    },

    identify: (id: string) => {
      posthog?.identify(id);
    },

    pageView: () => {
      posthog?.capture(TelemetryEvent.PageView);
    },

    soundPlayed: (sound: Sound) => {
      posthog?.capture(TelemetryEvent.SoundPlayed, { sound });
    },

    soundStopped: (sound: Sound) => {
      posthog?.capture(TelemetryEvent.SoundStopped, { sound });
    },

    categoryPlayed: (category: string) => {
      posthog?.capture(TelemetryEvent.CategoryPlayed, { category });
    },

    categoryStopped: (category: string) => {
      posthog?.capture(TelemetryEvent.CategoryStopped, { category });
    },
  };
};
