import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("shared localization boundaries", () => {
  it("keeps timer controls and settings on translation keys", () => {
    const timerSource = readSource("src/components/timer.tsx");
    const timerSettingsSource = readSource(
      "src/components/timer-settings.dialog.tsx"
    );

    expect(timerSource).toContain('t("timer.controls.focusLabel")');
    expect(timerSource).toContain('t("timer.controls.breakLabel")');
    expect(timerSource).toContain('t("timer.controls.viewStats")');
    expect(timerSource).toContain('t("timer.controls.settings")');
    expect(timerSource).toContain('t("timer.settings.notifications.denied")');
    expect(timerSource).not.toContain('"View stats"');
    expect(timerSource).not.toContain('"Skip to next stage"');

    expect(timerSettingsSource).toContain('t("timer.validation.invalidNumber")');
    expect(timerSettingsSource).toContain('t("timer.validation.min"');
    expect(timerSettingsSource).toContain('t("timer.validation.max"');
    expect(timerSettingsSource).toContain(
      't("timer.settings.notificationSound.label")'
    );
    expect(timerSettingsSource).toContain(
      't("timer.settings.soundPicker.preview")'
    );
    expect(timerSettingsSource).not.toContain('"Preview sound"');
    expect(timerSettingsSource).not.toContain('"Select a sound"');
    expect(timerSettingsSource).not.toContain('"Saving..."');
  });

  it("keeps shared blocker preset UI on translation keys", () => {
    const siteListSource = readSource(
      "src/components/core/site-blocker/components/site-list.tsx"
    );
    const siteItemSource = readSource(
      "src/components/core/site-blocker/components/site-item.tsx"
    );

    expect(siteListSource).toContain('t("site-blocker.drawer.presets.heading")');
    expect(siteListSource).toContain(
      't("site-blocker.drawer.presets.blockAll")'
    );
    expect(siteListSource).toContain(
      't("site-blocker.drawer.presets.unblockAll")'
    );
    expect(siteListSource).not.toContain('"Popular sites"');
    expect(siteListSource).not.toContain('"Block all"');

    expect(siteItemSource).toContain('t("site-blocker.drawer.presets.blocked")');
    expect(siteItemSource).toContain('t("site-blocker.drawer.presets.block")');
    expect(siteItemSource).not.toContain('"Blocked"');
    expect(siteItemSource).not.toContain('"Block"');
  });
});
