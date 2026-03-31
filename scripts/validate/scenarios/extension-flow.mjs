import { existsSync } from "node:fs";
import path from "node:path";

import { blockerPattern, extensionOutputDir, pregrantBlockerAccess, repoRoot } from "../lib/config.mjs";
import { connectToTarget, waitForTarget } from "../lib/cdp.mjs";
import { launchBrowserSession } from "../lib/browser-session.mjs";
import {
  clickButtonByText,
  clickButtonByTitle,
  getBodyText,
  getTimerValue,
  hasAllSitesPermission,
  openTabFromWorker,
  requestAllSitesPermission,
  sendRuntimeMessage,
  setDockState,
  setInputByPlaceholder,
  waitForBodyText,
  waitForBodyTextGone,
  waitForButtonByTitle,
  waitForTabUrl,
  waitForUrl,
} from "../lib/page-actions.mjs";
import { assert, logStep, runCommand, sleep, waitFor } from "../lib/utils.mjs";

export async function runExtensionValidation() {
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
  const {
    blockedPrefix,
    cleanup,
    newtabUrl,
    port,
    workerClient,
  } = session;
  let browserClient = session.browserClient;
  let newtabClient;
  let blockedPageClient;

  try {
    logStep(`Using blocked-domain smoke target: ${blockerPattern}`);
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

    logStep("Validating timer start, tick, pause, and reset");
    await setDockState(newtabClient, {
      isTimerVisible: true,
      isGreetingsVisible: true,
      isSiteBlockerVisible: false,
    });
    await waitForButtonByTitle(newtabClient, "Start");
    const initialTimer = await getTimerValue(newtabClient);
    assert(initialTimer === "25:00", `Expected fresh timer to show 25:00, got ${initialTimer}`);
    await clickButtonByTitle(newtabClient, "Start");
    await waitForButtonByTitle(newtabClient, "Pause");
    await sleep(2200);
    const runningTimer = await getTimerValue(newtabClient);
    assert(
      runningTimer !== initialTimer,
      "Expected timer display to change after starting."
    );
    await clickButtonByTitle(newtabClient, "Pause");
    await waitForButtonByTitle(newtabClient, "Start");
    const pausedTimer = await getTimerValue(newtabClient);
    await sleep(1600);
    const pausedTimerAfterWait = await getTimerValue(newtabClient);
    assert(
      pausedTimer === pausedTimerAfterWait,
      "Expected paused timer display to stay stable."
    );
    await clickButtonByTitle(newtabClient, "Reset");
    await waitFor(
      "timer reset to 25:00",
      () => getTimerValue(newtabClient),
      (value) => value === "25:00",
      10000
    );

    logStep("Opening site blocker drawer and validating bootstrap");
    await setDockState(newtabClient, {
      isTimerVisible: false,
      isGreetingsVisible: true,
      isSiteBlockerVisible: true,
    });
    await waitForBodyText(newtabClient, "Site blocker");
    await waitForBodyTextGone(newtabClient, "Syncing blocker state...");

    logStep(
      pregrantBlockerAccess
        ? "Checking pregranted all-sites access"
        : "Requesting all-sites access"
    );
    const permissionGranted = await requestAllSitesPermission(newtabClient);
    assert(permissionGranted, "Expected all-sites permission request to succeed.");
    await waitFor(
      "all-sites permission",
      () => hasAllSitesPermission(newtabClient),
      Boolean,
      15000
    );
    await waitForBodyText(newtabClient, "All-sites access is granted.");

    logStep("Adding and verifying a custom blocked domain");
    await setInputByPlaceholder(newtabClient, "Add a custom domain", blockerPattern);
    await clickButtonByText(newtabClient, "Add");
    await waitForBodyText(newtabClient, blockerPattern);

    const blockedTab = await openTabFromWorker(workerClient, `https://${blockerPattern}`);
    const blockedTabId = blockedTab.id;
    assert(
      typeof blockedTabId === "number",
      "Expected a numeric tab id for the blocked-domain tab."
    );
    await waitForTabUrl(
      workerClient,
      blockedTabId,
      (url) =>
        typeof url === "string" &&
        (url.startsWith(blockedPrefix) || url.startsWith(`https://${blockerPattern}`)),
      "blocked-domain tab navigation"
    );
    const blockedPageTarget = await waitForTarget(
      port,
      (target) =>
        target.type === "page" &&
        typeof target.url === "string" &&
        target.url.startsWith(blockedPrefix),
      "blocked page target",
      15000
    );
    blockedPageClient = await connectToTarget(blockedPageTarget);

    logStep("Validating blocked-page actions and bypass flow");
    await waitForBodyText(blockedPageClient, "This site is blocked");
    await waitForBodyText(blockedPageClient, "Bypass 15 min");
    await clickButtonByText(blockedPageClient, "Bypass 15 min");
    await waitForBodyText(blockedPageClient, "Bypass enabled for 15 minutes.");
    await clickButtonByText(blockedPageClient, "Continue to exact URL");
    await waitForUrl(
      blockedPageClient,
      (url) => typeof url === "string" && !url.startsWith(blockedPrefix),
      "continue-to-url navigation away from blocked page",
      15000
    );

    logStep("Removing the custom rule and ending the bypass");
    await sendRuntimeMessage(newtabClient, {
      type: "blocker/end-bypass",
      payload: { pattern: blockerPattern },
    });
    await waitForBodyText(newtabClient, blockerPattern);
    await clickButtonByText(newtabClient, "Remove");
    await waitFor(
      "custom rule removal",
      () => getBodyText(newtabClient),
      (value) => typeof value === "string" && !value.includes(blockerPattern),
      10000
    );

    logStep("Verifying the domain no longer redirects after removal");
    const unblockedTab = await openTabFromWorker(workerClient, `https://${blockerPattern}`);
    await waitForTabUrl(
      workerClient,
      unblockedTab.id,
      (url) => typeof url === "string" && !url.startsWith(blockedPrefix),
      "unblocked-domain navigation"
    );

    logStep("Re-adding the custom rule for focus-only validation");
    await setInputByPlaceholder(newtabClient, "Add a custom domain", blockerPattern);
    await clickButtonByText(newtabClient, "Add");
    await waitForBodyText(newtabClient, blockerPattern);

    logStep("Switching to focus-only mode and verifying break stage stays unblocked");
    const focusOnlyState = await sendRuntimeMessage(newtabClient, {
      type: "blocker/set-activation-mode",
      payload: { activationMode: "focus-only" },
    });
    assert(
      focusOnlyState?.state?.settings?.activationMode === "focus-only",
      "Expected blocker activation mode to switch to focus-only."
    );

    const breakStageResult = await sendRuntimeMessage(newtabClient, {
      type: "blocker/set-timer-state",
      payload: {
        stage: "break",
        isRunning: true,
      },
    });
    assert(
      breakStageResult?.ok === true,
      "Expected break-stage timer override to succeed."
    );

    const breakModeTab = await openTabFromWorker(
      workerClient,
      `https://${blockerPattern}`
    );
    await waitForTabUrl(
      workerClient,
      breakModeTab.id,
      (url) => typeof url === "string" && !url.startsWith(blockedPrefix),
      "focus-only break-stage navigation"
    );

    logStep("Switching timer to focus stage and verifying blocking resumes");
    const focusStageResult = await sendRuntimeMessage(newtabClient, {
      type: "blocker/set-timer-state",
      payload: {
        stage: "focus",
        isRunning: true,
      },
    });
    assert(
      focusStageResult?.ok === true,
      "Expected focus-stage timer override to succeed."
    );

    const focusBlockedTab = await openTabFromWorker(
      workerClient,
      `https://${blockerPattern}`
    );
    await waitForTabUrl(
      workerClient,
      focusBlockedTab.id,
      (url) => typeof url === "string" && url.startsWith(blockedPrefix),
      "focus-only focus-stage navigation"
    );
    const focusBlockedTarget = await waitForTarget(
      port,
      (target) =>
        target.type === "page" &&
        typeof target.url === "string" &&
        target.url.startsWith(blockedPrefix),
      "focus-only blocked page target",
      15000
    );
    const focusBlockedClient = await connectToTarget(focusBlockedTarget);
    await waitForBodyText(focusBlockedClient, "This site is blocked");
    await focusBlockedClient.close();

    logStep("Resetting blocker state after focus-only validation");
    const breakIdleResult = await sendRuntimeMessage(newtabClient, {
      type: "blocker/set-timer-state",
      payload: {
        stage: "break",
        isRunning: false,
      },
    });
    assert(
      breakIdleResult?.ok === true,
      "Expected timer override reset to succeed."
    );
    const alwaysOnState = await sendRuntimeMessage(newtabClient, {
      type: "blocker/set-activation-mode",
      payload: { activationMode: "always" },
    });
    assert(
      alwaysOnState?.state?.settings?.activationMode === "always",
      "Expected blocker activation mode to return to always."
    );
    await clickButtonByText(newtabClient, "Remove");
    await waitFor(
      "focus-only cleanup rule removal",
      () => getBodyText(newtabClient),
      (value) => typeof value === "string" && !value.includes(blockerPattern),
      10000
    );

    logStep("Validation passed");
  } finally {
    await Promise.allSettled([
      blockedPageClient?.close(),
      newtabClient?.close(),
      workerClient?.close(),
      browserClient?.close(),
    ]);
    await cleanup();
  }
}
