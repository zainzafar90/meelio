import posthog from "posthog-js";
import { env } from "../../utils/env.utils";
import { Sound } from "../..";

export enum TelemetryEvent {
  PageView = "Page View",
  SoundPlayed = "Sound Played",
  SoundStopped = "Sound Stopped",
  CategoryPlayed = "Category Played",
  CategoryStopped = "Category Stopped",
}

export class Telemetry {
  private static _instance: Telemetry;
  private initialized = false;

  public static get instance(): Telemetry {
    if (!Telemetry._instance) {
      Telemetry._instance = new Telemetry();
    }
    return Telemetry._instance;
  }

  public initialize() {
    if (this.initialized) return;

    posthog.init(env.posthogKey, {
      api_host: env.posthogHost,
      persistence: "localStorage",
      autocapture: true,
      debug: env.dev,
      loaded: (posthog) => {
        if (env.dev) {
          posthog.debug();
        }
      },
    });

    this.initialized = true;
  }

  public track(event: string, properties?: Record<string, unknown>): void {
    if (!this.initialized) {
      throw new Error("Telemetry not initialized. Call initialize() first");
    }
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
