import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(process.cwd(), "../..");
const validatorPath = path.join(repoRoot, "scripts/validate/extension.mjs");
const workflowPath = path.join(
  repoRoot,
  ".github/workflows/extension-validator.yml"
);

describe("extension validator coverage", () => {
  it("covers focus-only blocker mode explicitly", () => {
    const source = readFileSync(validatorPath, "utf8");

    expect(source).toContain("focus-only");
    expect(source).toContain("blocker/set-timer-state");
    expect(source).toContain("blocker/set-activation-mode");
  });

  it("is wired into CI", () => {
    expect(existsSync(workflowPath)).toBe(true);

    const workflow = readFileSync(workflowPath, "utf8");
    expect(workflow).toContain("pnpm validate:extension");
  });
});
