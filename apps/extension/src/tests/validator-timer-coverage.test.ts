import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(process.cwd(), "../..");
const timerScenarioPath = path.join(
  repoRoot,
  "scripts/validate/scenarios/extension-timer-flow.mjs"
);
const packageJsonPath = path.join(repoRoot, "package.json");
const extensionValidatorPath = path.join(repoRoot, "scripts/validate/extension.mjs");

describe("timer validator coverage", () => {
  it("uses extension-scoped timer validation commands", () => {
    const packageJson = readFileSync(packageJsonPath, "utf8");

    expect(packageJson).toContain('"validate:extension:timer"');
    expect(packageJson).toContain('"validate:extension:blocker"');
    expect(packageJson).not.toContain('"validate:timer"');
  });

  it("makes the top-level extension validator an umbrella over timer and blocker", () => {
    const source = readFileSync(extensionValidatorPath, "utf8");

    expect(source).toContain('runCommand("pnpm", ["validate:extension:timer"])');
    expect(source).toContain('runCommand("pnpm", ["validate:extension:blocker"])');
  });

  it("covers restore, auto-start, and settings persistence flows explicitly", () => {
    const source = readFileSync(timerScenarioPath, "utf8");

    expect(source).toContain("persisted one-minute focus duration after reload");
    expect(source).toContain("restoring an in-progress timer after reload");
    expect(source).toContain("auto-start disabled keeps the next stage idle");
    expect(source).toContain("auto-start enabled resumes the break stage automatically");
    expect(source).toContain("notification and sound settings persist after reload");
  });
});
