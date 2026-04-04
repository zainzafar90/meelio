import { existsSync } from "node:fs";
import path from "node:path";

import { extensionOutputDir, repoRoot } from "../lib/config.mjs";
import { connectToTarget, waitForTarget } from "../lib/cdp.mjs";
import { launchBrowserSession } from "../lib/browser-session.mjs";
import { assert, logStep, runCommand } from "../lib/utils.mjs";

export const APP_STORE_KEY = "meelio:local:app";
export const MANTRA_STORE_KEY = "meelio:local:mantra";
export const BACKGROUND_STORE_KEY = "meelio:local:background";

export async function openHomeValidationSession() {
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
  const { newtabUrl, port, workerClient } = session;

  logStep(`Launching browser on port ${port}`);
  logStep("Opening extension new tab");
  await workerClient.evaluate(`
    (async () => {
      const tab = await chrome.tabs.create({ url: ${JSON.stringify(newtabUrl)} });
      return { id: tab.id, url: tab.url ?? null };
    })()
  `);

  const newtabTarget = await waitForTarget(
    port,
    (target) => target.type === "page" && target.url === newtabUrl,
    "extension newtab page",
    15000
  );

  const newtabClient = await connectToTarget(newtabTarget);
  return { ...session, newtabClient };
}

export async function readGreetingText(pageClient) {
  return pageClient.evaluate(`
    (() => {
      const heading = document.querySelector("h2");
      return heading?.textContent?.trim() ?? "";
    })()
  `);
}

export async function clickGreeting(pageClient) {
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

export async function readAriaText(pageClient, ariaLabel) {
  return pageClient.evaluate(`
    (() => {
      const element = document.querySelector(${JSON.stringify(
        `[aria-label="${ariaLabel}"]`
      )});
      return element?.textContent?.trim() ?? "";
    })()
  `);
}
