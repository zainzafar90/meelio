import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("web timer boundaries", () => {
  it("keeps timer-core transitions inside the extracted application timer store", () => {
    const source = readSource("../../packages/application/src/timer/create-timer-store.ts");

    expect(source).toContain('from "@repo/timer-core"');
    expect(source).not.toContain("type TimerRuntimeAdapter,\n} from \"@repo/shared\"");
  });

  it("builds the web timer store from layered application/platform packages", () => {
    const source = readSource("src/stores/web.timer.store.ts");

    expect(source).toContain('from "@repo/application/timer"');
    expect(source).toContain('from "@repo/platform/web/timer"');
    expect(source).not.toContain('from "../../../../packages/shared/src/lib/db/pomodoro.dexie"');
    expect(source).not.toContain('from "../../../../packages/shared/src/services/sound-sync.service"');
    expect(source).not.toContain('from "../../../../packages/shared/src/utils/timer-events"');
  });
});
