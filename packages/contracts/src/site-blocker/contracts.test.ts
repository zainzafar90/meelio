import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import type {
  ExtensionCommand,
  ExtensionCommandResponseMap,
} from "./contracts";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, relativePath), "utf8");

describe("site-blocker contracts boundary", () => {
  it("stays transport and host agnostic", () => {
    const source = readSource("./contracts.ts");

    expect(source).not.toContain("chrome.");
    expect(source).not.toContain("window.");
    expect(source).not.toContain("react");
    expect(source).not.toContain("../../../core/src/");
  });

  it("defines the extension command and response contract types", () => {
    const command: ExtensionCommand = {
      type: "blocker/get-state",
    };
    const responseMap: Partial<ExtensionCommandResponseMap> = {
      "blocker/get-state": {
        state: {
          settings: {
            enabled: true,
            activationMode: "always",
            permissionGranted: false,
            updatedAt: 0,
          },
          rules: [],
          bypassGrants: [],
          events: [],
          sessions: [],
          dailyAggregates: [],
        },
      },
    };

    expect(command.type).toBe("blocker/get-state");
    expect(responseMap["blocker/get-state"]?.state.settings.enabled).toBe(true);
  });
});
