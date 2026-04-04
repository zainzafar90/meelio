import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("extension timer boundaries", () => {
  it("keeps the MV3 background on timer contracts/core instead of the shared root barrel", () => {
    const backgroundSource = readSource("src/entrypoints/background.ts");

    expect(backgroundSource).toContain('from "@repo/contracts/timer"');
    expect(backgroundSource).toContain('from "@repo/core/timer"');
    expect(backgroundSource).not.toContain('from "@repo/shared"');
  });

  it("builds the extension timer store from layered application/platform packages", () => {
    const storeSource = readSource("src/stores/extension.timer.store.ts");

    expect(storeSource).toContain('from "@repo/application/timer"');
    expect(storeSource).toContain('from "@repo/platform/extension/timer"');
    expect(storeSource).not.toContain('from "../../../../packages/shared/src/lib/db/pomodoro.dexie"');
    expect(storeSource).not.toContain('from "../../../../packages/shared/src/services/sound-sync.service"');
    expect(storeSource).not.toContain('from "../../../../packages/shared/src/utils/timer-events"');
  });
});
