import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("web timer boundaries", () => {
  it("uses timer-core contracts instead of pulling timer runtime types from the shared root barrel", () => {
    const source = readSource("src/stores/web.timer.store.ts");

    expect(source).toContain('from "@repo/timer-core"');
    expect(source).not.toContain("type TimerRuntimeAdapter,\n} from \"@repo/shared\"");
  });
});
