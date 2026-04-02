import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("extension localization boundaries", () => {
  it("keeps the blocker drawer on translation keys and locale-aware formatting", () => {
    const drawerSource = readSource(
      "src/components/extension.site-blocker.sheet.tsx"
    );

    expect(drawerSource).toContain('t("site-blocker.drawer.tabs.sites")');
    expect(drawerSource).toContain('t("site-blocker.drawer.custom.title")');
    expect(drawerSource).toContain('t("site-blocker.drawer.backup.importFailed")');
    expect(drawerSource).toContain('t("site-blocker.drawer.sections.controls")');
    expect(drawerSource).toContain('t("site-blocker.drawer.activity.title")');
    expect(drawerSource).toContain('t("site-blocker.drawer.activity.privacy")');
    expect(drawerSource).toContain('t("site-blocker.drawer.activity.clear")');
    expect(drawerSource).toContain('t("site-blocker.drawer.activity.clearConfirmTitle")');
    expect(drawerSource).toContain("formatLocalizedDuration");
    expect(drawerSource).toContain("formatLocalizedDateTime");
    expect(drawerSource).not.toContain(
      '"Strict blocking with lightweight activity review inside the new-tab drawer."'
    );
    expect(drawerSource).not.toContain('"Site access"');
    expect(drawerSource).not.toContain('"Stored only on this device"');
    expect(drawerSource).not.toContain('"Syncing blocker state..."');
  });

  it("keeps the blocked page on shared i18n helpers and translation keys", () => {
    const blockedPageSource = readSource("src/entrypoints/blocked/main.ts");

    expect(blockedPageSource).toContain("ensureI18nReady");
    expect(blockedPageSource).toContain("getI18nLocale");
    expect(blockedPageSource).toContain("site-blocker.blockedPage.title");
    expect(blockedPageSource).toContain(
      "site-blocker.blockedPage.navigationDescription"
    );
    expect(blockedPageSource).toContain("site-blocker.blockedPage.bypassEnabled");
    expect(blockedPageSource).not.toContain('"This site is blocked"');
    expect(blockedPageSource).not.toContain('"Temporary bypass"');
    expect(blockedPageSource).not.toContain('"Open Meelio settings"');
  });
});
