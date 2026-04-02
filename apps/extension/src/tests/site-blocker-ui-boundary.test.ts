import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("site blocker segmented control", () => {
  it("uses a clearly emphasized active tab treatment", () => {
    const drawerSource = readSource(
      "src/components/extension.site-blocker.sheet.tsx"
    );

    expect(drawerSource).toContain(
      '"border border-white/15 bg-zinc-100 text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.18)]"'
    );
    expect(drawerSource).not.toContain('? "bg-white/12 text-white"');
  });
});
