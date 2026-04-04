import { getValidationLabel } from "../lib/validation-labels.mjs";
import {
  clickButtonByText,
  readPersistedStoreState,
  setDockState,
} from "../lib/page-actions.mjs";
import { assert, logStep, waitFor } from "../lib/utils.mjs";
import {
  APP_STORE_KEY,
  BACKGROUND_STORE_KEY,
  openHomeValidationSession,
} from "./extension-home-common.mjs";

async function readCurrentWallpaper(pageClient) {
  const state = await readPersistedStoreState(pageClient, BACKGROUND_STORE_KEY);
  return state?.currentWallpaper ?? null;
}

export async function runWallpaperValidation() {
  const backgroundTitle = getValidationLabel("backgrounds.title");
  const randomBackgroundLabel = getValidationLabel("backgrounds.randomBackground");
  const resetBackgroundLabel = getValidationLabel("backgrounds.resetToDefault");
  const session = await openHomeValidationSession();
  const { cleanup, newtabClient } = session;

  try {
    logStep("Opening the background selector and validating wallpaper actions");
    await setDockState(newtabClient, {
      isTimerVisible: false,
      isGreetingsVisible: true,
      isBreathingVisible: false,
      isBackgroundsVisible: true,
      isSiteBlockerVisible: false,
    });
    await waitFor(
      "background sheet title",
      () => newtabClient.evaluate(`(() => document.body?.innerText ?? "")()`),
      (value) => typeof value === "string" && value.includes(backgroundTitle),
      10000
    );
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
  } finally {
    await cleanup();
  }
}
