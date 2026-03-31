import { describe, expect, it } from "vitest";

import arTranslation from "./locales/ar/translation.json";
import deTranslation from "./locales/de/translation.json";
import enTranslation from "./locales/en/translation.json";
import esTranslation from "./locales/es/translation.json";
import frTranslation from "./locales/fr/translation.json";
import jaTranslation from "./locales/ja/translation.json";
import ptTranslation from "./locales/pt/translation.json";
import ruTranslation from "./locales/ru/translation.json";
import zhTranslation from "./locales/zh/translation.json";

type TranslationTree = Record<string, unknown>;

const requiredShape = {
  timer: {
    controls: {
      focusLabel: enTranslation.timer.controls.focusLabel,
      breakLabel: enTranslation.timer.controls.breakLabel,
      resetLabel: enTranslation.timer.controls.resetLabel,
      viewStats: enTranslation.timer.controls.viewStats,
      statsLabel: enTranslation.timer.controls.statsLabel,
      skipToNextStage: enTranslation.timer.controls.skipToNextStage,
      settings: enTranslation.timer.controls.settings,
    },
    settings: {
      notifications: enTranslation.timer.settings.notifications,
      notificationSound: enTranslation.timer.settings.notificationSound,
      soundscapes: enTranslation.timer.settings.soundscapes,
      soundPicker: enTranslation.timer.settings.soundPicker,
      actions: {
        saving: enTranslation.timer.settings.actions.saving,
      },
      toast: {
        error: enTranslation.timer.settings.toast.error,
        errorDescription: enTranslation.timer.settings.toast.errorDescription,
      },
    },
    validation: enTranslation.timer.validation,
  },
  "site-blocker": {
    "invalid-url": enTranslation["site-blocker"]["invalid-url"],
    "already-blocked": enTranslation["site-blocker"]["already-blocked"],
    "site-added": enTranslation["site-blocker"]["site-added"],
    "already-exists": enTranslation["site-blocker"]["already-exists"],
    "add-failed": enTranslation["site-blocker"]["add-failed"],
    "input-placeholder": enTranslation["site-blocker"]["input-placeholder"],
    "add-button": enTranslation["site-blocker"]["add-button"],
    drawer: enTranslation["site-blocker"].drawer,
    blockedPage: enTranslation["site-blocker"].blockedPage,
  },
} satisfies TranslationTree;

const locales = {
  ar: arTranslation,
  de: deTranslation,
  en: enTranslation,
  es: esTranslation,
  fr: frTranslation,
  ja: jaTranslation,
  pt: ptTranslation,
  ru: ruTranslation,
  zh: zhTranslation,
} satisfies Record<string, TranslationTree>;

const collectLeafPaths = (
  value: unknown,
  prefix: string[] = []
): string[][] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    collectLeafPaths(nested, [...prefix, key])
  );
};

const readPath = (value: unknown, pathSegments: string[]) =>
  pathSegments.reduce<unknown>(
    (accumulator, segment) =>
      accumulator &&
      typeof accumulator === "object" &&
      !Array.isArray(accumulator)
        ? (accumulator as Record<string, unknown>)[segment]
        : undefined,
    value
  );

describe("localization completeness", () => {
  const requiredPaths = collectLeafPaths(requiredShape);

  it.each(Object.entries(locales))(
    "covers blocker and timer strings for %s",
    (locale, translation) => {
      for (const pathSegments of requiredPaths) {
        const value = readPath(translation, pathSegments);

        expect(value, `${locale} missing ${pathSegments.join(".")}`).toBeTypeOf(
          "string"
        );
        expect(
          String(value).trim().length,
          `${locale} has empty ${pathSegments.join(".")}`
        ).toBeGreaterThan(0);
      }
    }
  );
});
