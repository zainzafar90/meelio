import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(process.cwd(), "../..");
const homeScenarioPath = path.join(
  repoRoot,
  "scripts/validate/scenarios/extension-home-flow.mjs"
);
const packageJsonPath = path.join(repoRoot, "package.json");
const extensionValidatorPath = path.join(repoRoot, "scripts/validate/extension.mjs");

describe("home validator coverage", () => {
  it("adds an extension-scoped home validation command", () => {
    const packageJson = readFileSync(packageJsonPath, "utf8");

    expect(packageJson).toContain('"validate:extension:home"');
  });

  it("makes the top-level extension validator include the home flow", () => {
    const source = readFileSync(extensionValidatorPath, "utf8");

    expect(source).toContain('runCommand("pnpm", ["validate:extension:home"])');
    expect(source).toContain('runCommand("pnpm", ["validate:extension:timer"])');
    expect(source).toContain('runCommand("pnpm", ["validate:extension:blocker"])');
  });

  it("covers greeting, quote, wallpaper, and breathing flows explicitly", () => {
    const source = readFileSync(homeScenarioPath, "utf8");

    expect(source).toContain("Validating the greeting and quote surfaces on the default home view");
    expect(source).toContain("Validating mantra toggling with rotation disabled");
    expect(source).toContain("Opening the background selector and validating wallpaper actions");
    expect(source).toContain("Opening breathing mode and validating method and session controls");
  });
});
