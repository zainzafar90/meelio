import posthog from "posthog-js";

import { Sound } from "../../types/sound";
import { env } from "../../utils/env.utils";

export enum TelemetryEvent {
  PageView = "Page View",
  SoundPlayed = "Sound Played",
  SoundStopped = "Sound Stopped",
  CategoryPlayed = "Category Played",
  CategoryStopped = "Category Stopped",
}

export class Telemetry {
  private static _instance: Telemetry;

  public static get instance(): Telemetry {
    console.log(Telemetry._instance);
    if (!Telemetry._instance) {
      Telemetry._instance = new Telemetry();
    }

    return Telemetry._instance;
  }

  public constructor() {
    if (Telemetry._instance) {
      throw new Error(
        "Error: Instantiation failed: Use Telemetry.instance instead of new."
      );
    }

    console.log(env.posthogHost);
    posthog.init(env.posthogKey as string, {
      api_host: env.posthogHost as string,
      persistence: "localStorage",
      autocapture: true,
      debug: env.dev === true,
      loaded: (posthog) => {
        if (env.dev === true) {
          posthog.debug();
        }
      },
    });
  }

  public track(event: string, properties?: Record<string, unknown>): void {
    posthog.capture(event, properties);
  }

  public identify(id: string): void {
    posthog.identify(id);
  }

  public pageView(): void {
    this.track(TelemetryEvent.PageView);
  }

  public soundPlayed(sound: Sound): void {
    this.track(TelemetryEvent.SoundPlayed, { sound });
  }

  public soundStopped(sound: Sound): void {
    this.track(TelemetryEvent.SoundStopped, { sound });
  }

  public categoryPlayed(category: string): void {
    this.track(TelemetryEvent.CategoryPlayed, { category });
  }

  public categoryStopped(category: string): void {
    this.track(TelemetryEvent.CategoryStopped, { category });
  }
}
