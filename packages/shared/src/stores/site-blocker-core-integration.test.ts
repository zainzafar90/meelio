import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("shared site blocker store integration", () => {
  it("delegates host normalization to the core site-blocker package", () => {
    const source = readSource("src/stores/site-blocker.store.ts");

    expect(source).toContain('from "@repo/core/site-blocker"');
    expect(source).not.toContain('../utils/site-blocker.utils');
    expect(source).toContain("normalizeSiteHost");
  });
});
