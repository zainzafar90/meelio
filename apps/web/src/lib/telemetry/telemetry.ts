import mixpanel from "mixpanel-browser";

import { Sound } from "@/types/sound";
import { env } from "@/utils/common.utils";

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

    mixpanel.init(env.VITE_MIXPANEL_TOKEN as string, {
      persistence: "localStorage",
      track_pageview: true,
      debug: env.DEV,
    });
  }

  public track(event: string, properties?: Record<string, unknown>): void {
    mixpanel.track(event, properties);
  }

  public identify(id: string): void {
    mixpanel.identify(id);
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
