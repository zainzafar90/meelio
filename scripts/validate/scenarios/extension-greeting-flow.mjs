import { getValidationLabel } from "../lib/validation-labels.mjs";
import {
  readPersistedStoreState,
  setDockState,
  writePersistedStoreState,
} from "../lib/page-actions.mjs";
import { assert, logStep, waitFor } from "../lib/utils.mjs";
import {
  APP_STORE_KEY,
  MANTRA_STORE_KEY,
  clickGreeting,
  openHomeValidationSession,
  readAriaText,
  readGreetingText,
} from "./extension-home-common.mjs";

export async function runGreetingValidation() {
  const quoteAriaLabel = getValidationLabel("home.quote.aria.quote");
  const quoteAuthorAriaLabel = getValidationLabel("home.quote.aria.author");
  const session = await openHomeValidationSession();
  const { cleanup, newtabClient } = session;

  try {
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
    const appState = await readPersistedStoreState(newtabClient, APP_STORE_KEY);
    assert(
      appState?.mantraRotationEnabled === false,
      "Expected mantra rotation to stay disabled during the greeting validator."
    );
  } finally {
    await cleanup();
  }
}
