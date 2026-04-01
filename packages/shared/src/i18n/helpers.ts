import type { TOptions } from "i18next";

import i18n from "./i18n";

export const ensureI18nReady = async () => {
  if (!i18n.isInitialized) {
    await i18n.init();
  }

  return i18n;
};

export const getI18nLocale = () =>
  i18n.resolvedLanguage || i18n.language || "en";

export const translate = (key: string, options?: TOptions) =>
  i18n.t(key, options);

export const formatLocalizedDateTime = (
  value: string | number | Date,
  locale = getI18nLocale()
) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const narrowUnitFormatter = (locale: string, unit: "hour" | "minute") =>
  new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "narrow",
    maximumFractionDigits: 0,
  });

export const formatLocalizedDuration = (
  durationMs: number,
  locale = getI18nLocale()
) => {
  const totalMinutes = Math.max(0, Math.round(durationMs / 60_000));

  if (totalMinutes < 60) {
    return narrowUnitFormatter(locale, "minute").format(totalMinutes);
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourText = narrowUnitFormatter(locale, "hour").format(hours);

  if (minutes === 0) {
    return hourText;
  }

  return `${hourText} ${narrowUnitFormatter(locale, "minute").format(minutes)}`;
};
