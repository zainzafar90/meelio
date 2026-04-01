import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("extension timer boundaries", () => {
  it("keeps the MV3 background on timer-core instead of the shared root barrel", () => {
    const backgroundSource = readSource("src/entrypoints/background.ts");

    expect(backgroundSource).toContain('from "@repo/timer-core"');
    expect(backgroundSource).not.toContain('from "@repo/shared"');
  });

  it("builds the extension timer store locally instead of importing createTimerStore from shared", () => {
    const storeSource = readSource("src/stores/extension.timer.store.ts");

    expect(storeSource).toContain("createInitialTimerSnapshot");
    expect(storeSource).not.toContain("createTimerStore");
    expect(storeSource).not.toContain('from "@repo/shared"');
  });
});
