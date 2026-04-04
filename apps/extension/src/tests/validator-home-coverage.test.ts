import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(process.cwd(), "../..");
const greetingScenarioPath = path.join(
  repoRoot,
  "scripts/validate/scenarios/extension-greeting-flow.mjs"
);
const wallpaperScenarioPath = path.join(
  repoRoot,
  "scripts/validate/scenarios/extension-wallpaper-flow.mjs"
);
const breathingScenarioPath = path.join(
  repoRoot,
  "scripts/validate/scenarios/extension-breathing-flow.mjs"
);
const packageJsonPath = path.join(repoRoot, "package.json");
const homeValidatorPath = path.join(repoRoot, "scripts/validate/extension-home.mjs");
const extensionValidatorPath = path.join(repoRoot, "scripts/validate/extension.mjs");

describe("home validator coverage", () => {
  it("adds extension-scoped home feature validation commands", () => {
    const packageJson = readFileSync(packageJsonPath, "utf8");

    expect(packageJson).toContain('"validate:extension:home"');
    expect(packageJson).toContain('"validate:extension:greeting"');
    expect(packageJson).toContain('"validate:extension:wallpaper"');
    expect(packageJson).toContain('"validate:extension:breathing"');
  });

  it("makes the home validator an umbrella over greeting, wallpaper, and breathing", () => {
    const source = readFileSync(homeValidatorPath, "utf8");

    expect(source).toContain('runCommand("pnpm", ["validate:extension:greeting"])');
    expect(source).toContain('runCommand("pnpm", ["validate:extension:wallpaper"])');
    expect(source).toContain('runCommand("pnpm", ["validate:extension:breathing"])');
  });

  it("makes the top-level extension validator include the home flow", () => {
    const source = readFileSync(extensionValidatorPath, "utf8");

    expect(source).toContain('runCommand("pnpm", ["validate:extension:home"])');
    expect(source).toContain('runCommand("pnpm", ["validate:extension:timer"])');
    expect(source).toContain('runCommand("pnpm", ["validate:extension:blocker"])');
  });

  it("covers greeting, wallpaper, and breathing flows explicitly in separate scenarios", () => {
    const greetingSource = readFileSync(greetingScenarioPath, "utf8");
    const wallpaperSource = readFileSync(wallpaperScenarioPath, "utf8");
    const breathingSource = readFileSync(breathingScenarioPath, "utf8");

    expect(greetingSource).toContain("Validating the greeting and quote surfaces on the default home view");
    expect(greetingSource).toContain("Validating mantra toggling with rotation disabled");
    expect(wallpaperSource).toContain("Opening the background selector and validating wallpaper actions");
    expect(breathingSource).toContain("Opening breathing mode and validating method and session controls");
  });
});
