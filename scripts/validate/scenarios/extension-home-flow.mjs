import { existsSync } from "node:fs";
import path from "node:path";

import { extensionOutputDir, repoRoot } from "../lib/config.mjs";
import { connectToTarget, waitForTarget } from "../lib/cdp.mjs";
import { launchBrowserSession } from "../lib/browser-session.mjs";
import { getValidationLabel } from "../lib/validation-labels.mjs";
import {
  clickButtonByText,
  clickElementContainingText,
  getBodyText,
  openTabFromWorker,
  readPersistedStoreState,
  setDockState,
  waitForBodyText,
  writePersistedStoreState,
} from "../lib/page-actions.mjs";
import { assert, logStep, runCommand, waitFor } from "../lib/utils.mjs";

const APP_STORE_KEY = "meelio:local:app";
const MANTRA_STORE_KEY = "meelio:local:mantra";
const BACKGROUND_STORE_KEY = "meelio:local:background";

async function readGreetingText(pageClient) {
  return pageClient.evaluate(`
    (() => {
      const heading = document.querySelector("h2");
      return heading?.textContent?.trim() ?? "";
    })()
  `);
}

async function clickGreeting(pageClient) {
  const clicked = await pageClient.evaluate(`
    (() => {
      const heading = document.querySelector("h2");
      const target = heading?.closest("div");
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      target.click();
      return true;
    })()
  `);

  assert(clicked, "Expected greeting surface to be clickable.");
}

async function readAriaText(pageClient, ariaLabel) {
  return pageClient.evaluate(`
    (() => {
      const element = document.querySelector(${JSON.stringify(
        `[aria-label="${ariaLabel}"]`
      )});
      return element?.textContent?.trim() ?? "";
    })()
  `);
}

async function readCurrentWallpaper(pageClient) {
  const state = await readPersistedStoreState(pageClient, BACKGROUND_STORE_KEY);
  return state?.currentWallpaper ?? null;
}

export async function runHomeValidation() {
  const backgroundTitle = getValidationLabel("backgrounds.title");
  const randomBackgroundLabel = getValidationLabel("backgrounds.randomBackground");
  const resetBackgroundLabel = getValidationLabel("backgrounds.resetToDefault");
  const breathingMethodChangeLabel = getValidationLabel("breathing.method.change");
  const breathingMethodTitle = getValidationLabel("breathing.method.title");
  const quoteAriaLabel = getValidationLabel("home.quote.aria.quote");
  const quoteAuthorAriaLabel = getValidationLabel("home.quote.aria.author");

  assert(
    existsSync(extensionOutputDir) || existsSync(path.join(repoRoot, "apps/extension")),
    "Expected apps/extension to exist in this workspace."
  );

  logStep("Running extension tests");
  await runCommand("pnpm", ["--filter", "extension", "test", "--", "--run"]);

  logStep("Building extension");
  await runCommand("pnpm", ["--filter", "extension", "build"]);
  assert(
    existsSync(extensionOutputDir),
    `Missing built extension output at ${extensionOutputDir}`
  );

  const session = await launchBrowserSession();
  const { cleanup, newtabUrl, port, workerClient } = session;
  let newtabClient;

  try {
    logStep(`Launching browser on port ${port}`);

    logStep("Opening extension new tab");
    await openTabFromWorker(workerClient, newtabUrl);
    const newtabTarget = await waitForTarget(
      port,
      (target) => target.type === "page" && target.url === newtabUrl,
      "extension newtab page",
      15000
    );
    newtabClient = await connectToTarget(newtabTarget);

    logStep("Validating the greeting and quote surfaces on the default home view");
    await setDockState(newtabClient, {
      isTimerVisible: false,
      isGreetingsVisible: true,
      isBreathingVisible: false,
      isBackgroundsVisible: false,
      isSiteBlockerVisible: false,
    });
    await waitFor(
      "default greeting headline",
      () => readGreetingText(newtabClient),
      (value) => typeof value === "string" && value.length > 0,
      10000
    );
    const quoteText = await readAriaText(newtabClient, quoteAriaLabel);
    const quoteAuthor = await readAriaText(newtabClient, quoteAuthorAriaLabel);
    assert(quoteText.length > 0, "Expected a visible inspirational quote.");
    assert(quoteAuthor.length > 0, "Expected a visible quote author.");

    logStep("Validating mantra toggling with rotation disabled");
    await writePersistedStoreState(
      newtabClient,
      APP_STORE_KEY,
      { mantraRotationEnabled: false },
      3
    );
    await writePersistedStoreState(
      newtabClient,
      MANTRA_STORE_KEY,
      { isMantraVisible: false },
      3
    );
    await newtabClient.reload();
    await setDockState(newtabClient, {
      isTimerVisible: false,
      isGreetingsVisible: true,
      isBreathingVisible: false,
      isBackgroundsVisible: false,
      isSiteBlockerVisible: false,
    });
    const greetingBeforeToggle = await waitFor(
      "greeting text after disabling mantra rotation",
      () => readGreetingText(newtabClient),
      (value) => typeof value === "string" && value.length > 0,
      10000
    );
    await clickGreeting(newtabClient);
    await waitFor(
      "greeting to switch to mantra text after click",
      () => readGreetingText(newtabClient),
      (value) =>
        typeof value === "string" &&
        value.length > 0 &&
        value !== greetingBeforeToggle,
      10000
    );

    logStep("Opening the background selector and validating wallpaper actions");
    await setDockState(newtabClient, {
      isTimerVisible: false,
      isGreetingsVisible: true,
      isBreathingVisible: false,
      isBackgroundsVisible: true,
      isSiteBlockerVisible: false,
    });
    await waitForBodyText(newtabClient, backgroundTitle);
    const wallpaperBeforeRandom = await readCurrentWallpaper(newtabClient);
    assert(
      wallpaperBeforeRandom?.id,
      "Expected a current wallpaper before changing backgrounds."
    );
    await clickButtonByText(newtabClient, randomBackgroundLabel);
    const wallpaperAfterRandom = await waitFor(
      "random wallpaper selection",
      () => readCurrentWallpaper(newtabClient),
      (value) =>
        Boolean(value?.id) && value.id !== wallpaperBeforeRandom.id,
      10000
    );
    const appStateAfterRandom = await readPersistedStoreState(
      newtabClient,
      APP_STORE_KEY
    );
    assert(
      appStateAfterRandom?.wallpaperRotationEnabled === false,
      "Expected random wallpaper selection to disable wallpaper rotation."
    );
    await clickButtonByText(newtabClient, resetBackgroundLabel);
    const appStateAfterReset = await waitFor(
      "wallpaper rotation to re-enable after reset",
      () => readPersistedStoreState(newtabClient, APP_STORE_KEY),
      (value) => value?.wallpaperRotationEnabled === true,
      10000
    );
    assert(
      appStateAfterReset.wallpaperRotationEnabled === true,
      "Expected wallpaper reset to re-enable wallpaper rotation."
    );
    const wallpaperAfterReset = await readCurrentWallpaper(newtabClient);
    assert(
      wallpaperAfterReset?.id && wallpaperAfterReset.id !== wallpaperAfterRandom.id,
      "Expected reset to move away from the random wallpaper."
    );

    logStep("Opening breathing mode and validating method and session controls");
    await setDockState(newtabClient, {
      isTimerVisible: false,
      isGreetingsVisible: false,
      isBreathingVisible: true,
      isBackgroundsVisible: false,
      isSiteBlockerVisible: false,
    });
    await waitFor(
      "breathing idle prompt",
      () => getBodyText(newtabClient),
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes("tap to start"),
      10000
    );
    await waitForBodyText(newtabClient, breathingMethodChangeLabel);
    await clickButtonByText(newtabClient, breathingMethodChangeLabel);
    await waitForBodyText(newtabClient, breathingMethodTitle);
    await clickButtonByText(newtabClient, "5 reps");
    await clickElementContainingText(newtabClient, "button", "Relax Deeply");
    await waitForBodyText(newtabClient, "4-7-8 Breathing");
    await clickElementContainingText(newtabClient, "button", "TAP TO START");
    await waitFor(
      "breathing to enter inhale phase",
      () => getBodyText(newtabClient),
      (value) =>
        typeof value === "string" && value.toLowerCase().includes("inhale"),
      10000
    );
  } finally {
    await cleanup();
  }
}
