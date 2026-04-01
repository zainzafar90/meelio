import { readFileSync } from "node:fs";
import path from "node:path";

import { repoRoot } from "./config.mjs";

const englishTranslationPath = path.join(
  repoRoot,
  "packages/shared/src/i18n/locales/en/translation.json"
);

const englishTranslation = JSON.parse(
  readFileSync(englishTranslationPath, "utf8")
);

const interpolate = (value, variables) =>
  value.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_match, key) =>
    String(variables[key] ?? "")
  );

export function getValidationCopy(key, variables = {}) {
  const value = key
    .split(".")
    .reduce((current, segment) => current?.[segment], englishTranslation);

  if (typeof value !== "string") {
    throw new Error(`Missing validation copy for key "${key}".`);
  }

  return interpolate(value, variables);
}
