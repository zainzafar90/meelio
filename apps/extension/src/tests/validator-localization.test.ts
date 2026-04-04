import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(process.cwd(), "../..");
const validatorConfigPath = path.join(repoRoot, "scripts/validate/lib/config.mjs");
const browserSessionPath = path.join(
  repoRoot,
  "scripts/validate/lib/browser-session.mjs"
);
const blockerScenarioPath = path.join(
  repoRoot,
  "scripts/validate/scenarios/extension-blocker-flow.mjs"
);
const timerScenarioPath = path.join(
  repoRoot,
  "scripts/validate/scenarios/extension-timer-flow.mjs"
);
const homeScenarioPath = path.join(
  repoRoot,
  "scripts/validate/scenarios/extension-home-flow.mjs"
);
const pageActionsPath = path.join(repoRoot, "scripts/validate/lib/page-actions.mjs");

describe("extension validator localization stability", () => {
  it("pins the browser locale so translated UI labels keep English smoke selectors stable", () => {
    const configSource = readFileSync(validatorConfigPath, "utf8");
    const browserSessionSource = readFileSync(browserSessionPath, "utf8");

    expect(configSource).toContain("MEELIO_VALIDATION_LOCALE");
    expect(configSource).toContain('"en-US"');
    expect(browserSessionSource).toContain("validationLocale");
    expect(browserSessionSource).toContain("`--lang=${validationLocale}`");
  });

  it("uses label-based timer controls instead of a brittle reset-title selector", () => {
    const scenarioSource = readFileSync(timerScenarioPath, "utf8");
    const pageActionsSource = readFileSync(pageActionsPath, "utf8");

    expect(pageActionsSource).toContain("export async function clickButtonByLabel");
    expect(pageActionsSource).toContain("export async function waitForButtonByLabel");
    expect(scenarioSource).toContain('const startLabel = getValidationLabel("common.actions.start")');
    expect(scenarioSource).toContain('const pauseLabel = getValidationLabel("common.actions.pause")');
    expect(scenarioSource).toContain('const resetLabel = getValidationLabel("timer.controls.resetLabel")');
    expect(scenarioSource).toContain("clickButtonByLabel(newtabClient, resetLabel)");
    expect(scenarioSource).toContain("waitForButtonByLabel(newtabClient, startLabel)");
    expect(scenarioSource).toContain("waitForButtonByLabel(newtabClient, pauseLabel)");
    expect(scenarioSource).not.toContain('clickButtonByTitle(newtabClient, "Reset")');
  });

  it("reads blocker copy from the English translation source instead of hardcoded UI text", () => {
    const scenarioSource = readFileSync(blockerScenarioPath, "utf8");

    expect(scenarioSource).toContain('getValidationLabel("site-blocker.title")');
    expect(scenarioSource).toContain(
      'getValidationLabel("site-blocker.blockedPage.continue")'
    );
    expect(scenarioSource).not.toContain('"Site blocker"');
    expect(scenarioSource).not.toContain('"Continue to exact URL"');
  });

  it("reads home-surface labels from translation keys instead of hardcoded UI copy", () => {
    const scenarioSource = readFileSync(homeScenarioPath, "utf8");

    expect(scenarioSource).toContain('getValidationLabel("backgrounds.title")');
    expect(scenarioSource).toContain('getValidationLabel("backgrounds.randomBackground")');
    expect(scenarioSource).toContain('getValidationLabel("backgrounds.resetToDefault")');
    expect(scenarioSource).toContain('getValidationLabel("breathing.method.change")');
    expect(scenarioSource).toContain('getValidationLabel("breathing.method.title")');
    expect(scenarioSource).toContain('getValidationLabel("home.quote.aria.quote")');
    expect(scenarioSource).toContain('getValidationLabel("home.quote.aria.author")');
  });
});
