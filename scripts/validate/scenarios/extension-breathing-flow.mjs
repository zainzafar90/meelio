import { getValidationLabel } from "../lib/validation-labels.mjs";
import {
  clickButtonByText,
  clickElementContainingText,
  getBodyText,
  setDockState,
  waitForBodyText,
} from "../lib/page-actions.mjs";
import { logStep, waitFor } from "../lib/utils.mjs";
import { openHomeValidationSession } from "./extension-home-common.mjs";

export async function runBreathingValidation() {
  const breathingMethodChangeLabel = getValidationLabel("breathing.method.change");
  const breathingMethodTitle = getValidationLabel("breathing.method.title");
  const session = await openHomeValidationSession();
  const { cleanup, newtabClient } = session;

  try {
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
