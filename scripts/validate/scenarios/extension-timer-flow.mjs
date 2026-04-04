import { existsSync } from "node:fs";
import path from "node:path";

import { extensionOutputDir, repoRoot } from "../lib/config.mjs";
import { connectToTarget, waitForTarget } from "../lib/cdp.mjs";
import { launchBrowserSession } from "../lib/browser-session.mjs";
import { getValidationLabel } from "../lib/validation-labels.mjs";
import {
  clearTimerPersistedState,
  clickButtonByLabel,
  clickButtonByText,
  clickButtonByTitle,
  getTimerValue,
  openTabFromWorker,
  readTimerPersistedState,
  setInputById,
  setDockState,
  toggleSwitchByText,
  writeTimerPersistedState,
  waitForBodyText,
  waitForButtonByLabel,
} from "../lib/page-actions.mjs";
import { assert, logStep, runCommand, sleep, waitFor } from "../lib/utils.mjs";

export async function runTimerValidation() {
  const startLabel = getValidationLabel("common.actions.start");
  const pauseLabel = getValidationLabel("common.actions.pause");
  const closeLabel = getValidationLabel("common.actions.close");
  const saveLabel = getValidationLabel("common.actions.save");
  const resetLabel = getValidationLabel("timer.controls.resetLabel");
  const breakModeLabel = getValidationLabel("timer.controls.breakMode");
  const focusModeLabel = getValidationLabel("timer.controls.focusMode");
  const skipStageLabel = getValidationLabel("timer.controls.skipToNextStage");
  const settingsLabel = getValidationLabel("timer.controls.settings");
  const viewStatsLabel = getValidationLabel("timer.controls.viewStats");
  const timerSettingsTitle = getValidationLabel("timer.settings.title");
  const timerStatsTitle = getValidationLabel("timer.stats.title");
  const timerStatsDescription = getValidationLabel("timer.stats.description");
  const notificationsLabel = getValidationLabel("timer.settings.notifications.label");
  const notificationSoundLabel = getValidationLabel(
    "timer.settings.notificationSound.label"
  );
  const soundscapesLabel = getValidationLabel("timer.settings.soundscapes.label");
  const autoStartLabel = getValidationLabel("timer.settings.autoStart.label");

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
  let browserClient = session.browserClient;

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

    logStep("Opening timer and validating the default focus duration");
    await setDockState(newtabClient, {
      isTimerVisible: true,
      isGreetingsVisible: true,
      isSiteBlockerVisible: false,
    });
    await waitForButtonByLabel(newtabClient, startLabel);
    const initialTimer = await getTimerValue(newtabClient);
    assert(initialTimer === "25:00", `Expected fresh timer to show 25:00, got ${initialTimer}`);

    logStep("Changing timer settings and verifying the new durations persist");
    await clickButtonByTitle(newtabClient, settingsLabel);
    await waitForBodyText(newtabClient, timerSettingsTitle);
    await setInputById(newtabClient, "focus-time", "1");
    await setInputById(newtabClient, "break-time", "2");
    await toggleSwitchByText(newtabClient, notificationSoundLabel);
    await toggleSwitchByText(newtabClient, soundscapesLabel);
    await toggleSwitchByText(newtabClient, autoStartLabel);
    await toggleSwitchByText(newtabClient, notificationsLabel);
    await clickButtonByText(newtabClient, saveLabel);
    await waitFor(
      "focus duration to update to one minute",
      () => getTimerValue(newtabClient),
      (value) => value === "1:00",
      10000
    );

    await newtabClient.reload();
    await waitForButtonByLabel(newtabClient, startLabel);
    await waitFor(
      "persisted one-minute focus duration after reload",
      () => getTimerValue(newtabClient),
      (value) => value === "1:00",
      10000
    );

    logStep("Checking that notification and sound settings persist after reload");
    const persistedSettings = await readTimerPersistedState(newtabClient);
    assert(
      persistedSettings?.settings?.notifications === false,
      "Expected notifications to persist as disabled."
    );
    assert(
      persistedSettings?.settings?.sounds === false,
      "Expected timer sounds to persist as disabled."
    );
    assert(
      persistedSettings?.settings?.soundscapes === false,
      "Expected soundscapes to persist as disabled."
    );
    assert(
      persistedSettings?.settings?.autoStartBreaks === false,
      "Expected auto-start breaks to persist as disabled."
    );

    logStep("Validating timer start, tick, pause, and updated-duration reset");
    await clickButtonByLabel(newtabClient, startLabel);
    await waitForButtonByLabel(newtabClient, pauseLabel);
    await sleep(2200);

    const runningTimer = await getTimerValue(newtabClient);
    assert(
      runningTimer !== initialTimer,
      "Expected timer display to change after starting with the updated duration."
    );

    await clickButtonByLabel(newtabClient, pauseLabel);
    await waitForButtonByLabel(newtabClient, startLabel);
    const pausedTimer = await getTimerValue(newtabClient);
    await sleep(1600);
    const pausedTimerAfterWait = await getTimerValue(newtabClient);
    assert(
      pausedTimer === pausedTimerAfterWait,
      "Expected paused timer display to stay stable."
    );

    await clickButtonByLabel(newtabClient, resetLabel);
    await waitFor(
      "timer reset to 1:00",
      () => getTimerValue(newtabClient),
      (value) => value === "1:00",
      10000
    );

    logStep("Checking stage controls and skip behavior with the updated break duration");
    await clickButtonByTitle(newtabClient, breakModeLabel);
    await waitFor(
      "break stage duration to update to two minutes",
      () => getTimerValue(newtabClient),
      (value) => value === "2:00",
      10000
    );
    await clickButtonByTitle(newtabClient, focusModeLabel);
    await waitFor(
      "focus stage duration to switch back to one minute",
      () => getTimerValue(newtabClient),
      (value) => value === "1:00",
      10000
    );
    await clickButtonByTitle(newtabClient, skipStageLabel);
    await waitFor(
      "skip control to move to the break stage",
      () => getTimerValue(newtabClient),
      (value) => value === "2:00",
      10000
    );
    await clickButtonByTitle(newtabClient, focusModeLabel);
    await waitFor(
      "focus stage after skipping back",
      () => getTimerValue(newtabClient),
      (value) => value === "1:00",
      10000
    );

    logStep("Opening the stats dialog and confirming it renders");
    await clickButtonByTitle(newtabClient, viewStatsLabel);
    await waitForBodyText(newtabClient, timerStatsTitle);
    await waitForBodyText(newtabClient, timerStatsDescription);
    await clickButtonByText(newtabClient, closeLabel);
    await waitForButtonByLabel(newtabClient, startLabel);

    logStep("Validating restoring an in-progress timer after reload");
    await writeTimerPersistedState(newtabClient, {
      stage: "focus",
      isRunning: true,
      endTimestamp: Date.now() + 4_000,
      prevRemaining: 4,
      durations: {
        focus: 4,
        break: 5,
      },
    });
    await newtabClient.reload();
    await waitForButtonByLabel(newtabClient, pauseLabel);
    const restoredTimer = await getTimerValue(newtabClient);
    assert(
      restoredTimer === "0:04" || restoredTimer === "0:03",
      `Expected restored timer to resume near 0:04, got ${restoredTimer}`
    );
    await sleep(1200);
    const restoredTimerAfterTick = await getTimerValue(newtabClient);
    assert(
      restoredTimerAfterTick !== restoredTimer,
      "Expected restored timer to continue ticking after reload."
    );
    await clickButtonByLabel(newtabClient, pauseLabel);
    await waitForButtonByLabel(newtabClient, startLabel);

    logStep("Checking that auto-start disabled keeps the next stage idle");
    await writeTimerPersistedState(newtabClient, {
      stage: "focus",
      isRunning: false,
      endTimestamp: null,
      prevRemaining: 1,
      durations: {
        focus: 1,
        break: 5,
      },
      settings: {
        autoStartBreaks: false,
      },
    });
    await newtabClient.reload();
    await waitForButtonByLabel(newtabClient, startLabel);
    await waitFor(
      "one-second focus timer before auto-start disabled check",
      () => getTimerValue(newtabClient),
      (value) => value === "0:01",
      10000
    );
    await clickButtonByLabel(newtabClient, startLabel);
    await waitFor(
      "break stage to stay idle after focus completion",
      () => getTimerValue(newtabClient),
      (value) => value === "0:05",
      10000
    );
    await waitForButtonByLabel(newtabClient, startLabel);

    logStep("Checking that auto-start enabled resumes the break stage automatically");
    await writeTimerPersistedState(newtabClient, {
      stage: "focus",
      isRunning: false,
      endTimestamp: null,
      prevRemaining: 1,
      durations: {
        focus: 1,
        break: 5,
      },
      settings: {
        autoStartBreaks: true,
      },
    });
    await newtabClient.reload();
    await waitForButtonByLabel(newtabClient, startLabel);
    await waitFor(
      "one-second focus timer before auto-start enabled check",
      () => getTimerValue(newtabClient),
      (value) => value === "0:01",
      10000
    );
    await clickButtonByLabel(newtabClient, startLabel);
    await waitForButtonByLabel(newtabClient, pauseLabel, 10000);
    await waitFor(
      "break stage timer after auto-start resumes",
      () => getTimerValue(newtabClient),
      (value) => value === "0:05" || value === "0:04",
      10000
    );
    await clickButtonByLabel(newtabClient, pauseLabel);
    await waitForButtonByLabel(newtabClient, startLabel);

    logStep("Cleaning up persisted timer state back to defaults");
    await clearTimerPersistedState(newtabClient);
    await newtabClient.reload();
    await waitForButtonByLabel(newtabClient, startLabel);
    await waitFor(
      "timer default duration after cleanup",
      () => getTimerValue(newtabClient),
      (value) => value === "25:00",
      10000
    );

    logStep("Validation passed");
  } finally {
    await Promise.allSettled([
      newtabClient?.close(),
      workerClient?.close(),
      browserClient?.close(),
    ]);
    await cleanup();
  }
}
