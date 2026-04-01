import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const extensionRoot = process.cwd();
const repoRoot = path.resolve(extensionRoot, "../..");

describe("i18n package boundary", () => {
  it("keeps app-level translation hooks on the shared i18n boundary", () => {
    const extensionNewtab = readFileSync(
      path.join(repoRoot, "apps/extension/src/newtab.tsx"),
      "utf8"
    );
    const webHome = readFileSync(
      path.join(repoRoot, "apps/web/src/routes/home/home.tsx"),
      "utf8"
    );

    expect(extensionNewtab).toContain("useTranslation");
    expect(extensionNewtab).toContain('from "@repo/shared/i18n"');
    expect(extensionNewtab).not.toContain('useTranslation,\n} from "@repo/shared"');
    expect(extensionNewtab).not.toContain('from "react-i18next"');

    expect(webHome).toContain("useTranslation");
    expect(webHome).toContain('from "@repo/shared/i18n"');
    expect(webHome).not.toContain('useTranslation,\n} from "@repo/shared"');
    expect(webHome).not.toContain('from "react-i18next"');
  });
});
