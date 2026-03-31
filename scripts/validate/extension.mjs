import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const extensionOutputDir = path.join(
  repoRoot,
  "apps/extension/.output/chrome-mv3"
);
const blockerPattern = process.env.MEELIO_BLOCK_TEST_DOMAIN || "zainzafar.net";
const blockedPageSuffix = "/blocked.html";

const browserCandidates = [
  process.env.MEELIO_BROWSER_PATH,
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

function logStep(message) {
  process.stdout.write(`\n[validate:extension] ${message}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runCommand(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed with exit code ${code ?? "unknown"}`
        )
      );
    });
  });
}

function findBrowserBinary() {
  const binary = browserCandidates.find((candidate) => existsSync(candidate));
  assert(
    binary,
    "No supported browser binary found. Set MEELIO_BROWSER_PATH to Edge or Chrome."
  );
  return binary;
}

async function getAvailablePort(start = 9226) {
  const tryPort = (port) =>
    new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.close(() => resolve(port));
      });
    });

  for (let port = start; port < start + 25; port += 1) {
    try {
      return await tryPort(port);
    } catch {
      // Try the next port.
    }
  }

  throw new Error("Unable to reserve a remote debugging port for the browser.");
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
}

async function waitFor(description, task, predicate, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastValue;
  let lastError;

  while (Date.now() < deadline) {
    try {
      lastValue = await task();
      if (predicate(lastValue)) {
        return lastValue;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(250);
  }

  if (lastError) {
    throw new Error(`${description} timed out. Last error: ${lastError.message}`);
  }

  throw new Error(
    `${description} timed out. Last value: ${JSON.stringify(lastValue, null, 2)}`
  );
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.socket = null;
    this.nextId = 0;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.wsUrl);

    await new Promise((resolve, reject) => {
      const onOpen = () => {
        this.socket.removeEventListener("error", onError);
        resolve();
      };
      const onError = (event) => {
        this.socket.removeEventListener("open", onOpen);
        reject(event.error ?? new Error("Failed to open CDP socket"));
      };

      this.socket.addEventListener("open", onOpen);
      this.socket.addEventListener("error", onError);
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          reject(new Error(message.error.message));
          return;
        }
        resolve(message.result);
      }
    });
  }

  async send(method, params = {}) {
    const id = ++this.nextId;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "CDP evaluation failed");
    }

    return result.result?.value;
  }

  async reload() {
    await this.send("Page.reload");
  }

  async close() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.close();
      await sleep(50);
    }
  }
}

async function waitForDebugger(port) {
  return waitFor(
    "Chrome DevTools endpoint",
    () => fetchJson(`http://127.0.0.1:${port}/json/version`),
    (value) => Boolean(value?.webSocketDebuggerUrl),
    15000
  );
}

async function listTargets(port) {
  return fetchJson(`http://127.0.0.1:${port}/json/list`);
}

async function waitForTarget(port, predicate, description, timeoutMs = 15000) {
  return waitFor(
    description,
    async () => {
      const targets = await listTargets(port);
      return targets.find(predicate) ?? null;
    },
    (value) => Boolean(value),
    timeoutMs
  );
}

async function connectToTarget(target) {
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();

  if (target.type === "page") {
    await client.send("Page.enable");
  }
  await client.send("Runtime.enable");
  return client;
}

async function openTabFromWorker(workerClient, url) {
  return workerClient.evaluate(`
    (async () => {
      const tab = await chrome.tabs.create({ url: ${JSON.stringify(url)} });
      return { id: tab.id, url: tab.url ?? null };
    })()
  `);
}

async function waitForTabUrl(workerClient, tabId, predicate, description) {
  return waitFor(
    description,
    () =>
      workerClient.evaluate(`
        (async () => {
          const tab = await chrome.tabs.get(${tabId});
          return tab.url ?? null;
        })()
      `),
    predicate,
    15000
  );
}

async function getBodyText(pageClient) {
  return pageClient.evaluate(`
    (() => document.body ? document.body.innerText : "")()
  `);
}

async function waitForBodyText(pageClient, text, timeoutMs = 15000) {
  return waitFor(
    `page text "${text}"`,
    () => getBodyText(pageClient),
    (value) => typeof value === "string" && value.includes(text),
    timeoutMs
  );
}

async function waitForBodyTextGone(pageClient, text, timeoutMs = 15000) {
  return waitFor(
    `page text "${text}" to disappear`,
    () => getBodyText(pageClient),
    (value) => typeof value === "string" && !value.includes(text),
    timeoutMs
  );
}

async function waitForUrl(pageClient, predicate, description, timeoutMs = 15000) {
  return waitFor(
    description,
    () => pageClient.evaluate("(() => location.href)()"),
    predicate,
    timeoutMs
  );
}

async function clickButtonByTitle(pageClient, title) {
  const result = await pageClient.evaluate(`
    (() => {
      const button = document.querySelector(${JSON.stringify(
        `button[title="${title}"]`
      )});
      if (!button) {
        return false;
      }
      button.click();
      return true;
    })()
  `);

  assert(result, `Unable to find button with title "${title}".`);
}

async function waitForButtonByTitle(pageClient, title, timeoutMs = 15000) {
  return waitFor(
    `button with title "${title}"`,
    () =>
      pageClient.evaluate(`
        (() => Boolean(document.querySelector(${JSON.stringify(
          `button[title="${title}"]`
        )})))()
      `),
    Boolean,
    timeoutMs
  );
}

async function clickButtonByText(pageClient, label) {
  const result = await pageClient.evaluate(`
    (() => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (candidate) =>
          candidate instanceof HTMLButtonElement &&
          candidate.textContent?.trim() === ${JSON.stringify(label)}
      );
      if (!button) {
        return false;
      }
      button.click();
      return true;
    })()
  `);

  assert(result, `Unable to find button with label "${label}".`);
}

async function setInputByPlaceholder(pageClient, placeholder, value) {
  const result = await pageClient.evaluate(`
    (() => {
      const input = document.querySelector(${JSON.stringify(
        `input[placeholder="${placeholder}"]`
      )});
      if (!(input instanceof HTMLInputElement)) {
        return false;
      }
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      if (!valueSetter) {
        return false;
      }
      input.focus();
      valueSetter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: ${JSON.stringify(value)},
          inputType: "insertText",
        })
      );
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()
  `);

  assert(result, `Unable to find input with placeholder "${placeholder}".`);
}

async function setDockState(pageClient, nextState) {
  await pageClient.evaluate(`
    (() => {
      const dockKey = "meelio:local:dock";
      const onboardingKey = "meelio:local:onboarding";
      const rawDock = localStorage.getItem(dockKey);
      const dockPayload = rawDock ? JSON.parse(rawDock) : { state: {}, version: 7 };
      dockPayload.state = {
        ...dockPayload.state,
        currentOnboardingStep: -1,
        ...${JSON.stringify(nextState)},
      };
      localStorage.setItem(dockKey, JSON.stringify(dockPayload));
      localStorage.setItem(
        onboardingKey,
        JSON.stringify({
          state: {
            hasDockOnboardingCompleted: true,
          },
          version: 2,
        })
      );
      return dockPayload;
    })()
  `);
  await pageClient.reload();
}

async function getTimerValue(pageClient) {
  return pageClient.evaluate(`
    (() => {
      const timerText = Array.from(document.querySelectorAll("*"))
        .map((node) => node.textContent?.trim() ?? "")
        .find((text) => /^\\d+:\\d{2}$/.test(text));
      return timerText ?? null;
    })()
  `);
}

async function sendRuntimeMessage(pageClient, payload) {
  return pageClient.evaluate(`
    (async () => {
      return chrome.runtime.sendMessage(${JSON.stringify(payload)});
    })()
  `);
}

async function hasAllSitesPermission(pageClient) {
  return pageClient.evaluate(`
    (async () => {
      return chrome.permissions.contains({
        origins: ["http://*/*", "https://*/*"],
      });
    })()
  `);
}

async function requestAllSitesPermission(pageClient) {
  await clickButtonByText(pageClient, "Request access");
  await sleep(1200);

  if (await hasAllSitesPermission(pageClient)) {
    return true;
  }

  const granted = await pageClient.evaluate(`
    (async () => {
      return chrome.permissions.request({
        origins: ["http://*/*", "https://*/*"],
      });
    })()
  `);

  if (granted) {
    await sendRuntimeMessage(pageClient, {
      type: "blocker/request-host-access",
    });
  }

  return granted;
}

async function main() {
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

  const browserBinary = findBrowserBinary();
  const port = await getAvailablePort();
  const profileDir = mkdtempSync(path.join(os.tmpdir(), "meelio-validate-"));

  logStep(`Using blocked-domain smoke target: ${blockerPattern}`);
  logStep(`Launching browser on port ${port}`);
  const browserProcess = spawn(
    browserBinary,
    [
      `--user-data-dir=${profileDir}`,
      `--disable-extensions-except=${extensionOutputDir}`,
      `--load-extension=${extensionOutputDir}`,
      `--remote-debugging-port=${port}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--new-window",
      "about:blank",
    ],
    {
      cwd: repoRoot,
      stdio: "ignore",
    }
  );

  let cleanedUp = false;

  const removeProfileDir = () => {
    rmSync(profileDir, {
      force: true,
      recursive: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  };

  const waitForBrowserExit = async (timeoutMs) => {
    if (browserProcess.exitCode !== null) {
      return;
    }

    await Promise.race([
      new Promise((resolve) => browserProcess.once("exit", resolve)),
      sleep(timeoutMs),
    ]);
  };

  const cleanup = async () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;

    if (browserProcess.exitCode === null) {
      browserProcess.kill("SIGTERM");
      await waitForBrowserExit(2000);
    }

    if (browserProcess.exitCode === null) {
      browserProcess.kill("SIGKILL");
      await waitForBrowserExit(1000);
    }

    removeProfileDir();
  };

  process.on("exit", () => {
    try {
      removeProfileDir();
    } catch {
      // Best-effort exit cleanup only.
    }
  });
  process.on("SIGINT", () => {
    void cleanup().finally(() => process.exit(130));
  });
  process.on("SIGTERM", () => {
    void cleanup().finally(() => process.exit(143));
  });

  const version = await waitForDebugger(port);
  const browserClient = new CdpClient(version.webSocketDebuggerUrl);
  await browserClient.connect();
  await browserClient.send("Target.setDiscoverTargets", { discover: true });

  const serviceWorkerTarget = await waitForTarget(
    port,
    (target) =>
      target.type === "service_worker" &&
      typeof target.url === "string" &&
      target.url.startsWith("chrome-extension://") &&
      target.url.endsWith("/background.js"),
    "extension service worker target",
    20000
  );
  const extensionId = new URL(serviceWorkerTarget.url).host;
  const newtabUrl = `chrome-extension://${extensionId}/newtab.html`;
  const blockedPrefix = `chrome-extension://${extensionId}${blockedPageSuffix}`;

  const workerClient = await connectToTarget(serviceWorkerTarget);

  logStep("Opening extension new tab");
  await openTabFromWorker(workerClient, newtabUrl);
  const newtabTarget = await waitForTarget(
    port,
    (target) => target.type === "page" && target.url === newtabUrl,
    "extension newtab page",
    15000
  );
  const newtabClient = await connectToTarget(newtabTarget);

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

  logStep("Requesting all-sites access");
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
  const blockedPageClient = await connectToTarget(blockedPageTarget);

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
    (url) =>
      typeof url === "string" && !url.startsWith(blockedPrefix),
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

  await blockedPageClient.close();
  await newtabClient.close();
  await workerClient.close();
  await browserClient.close();
  await cleanup();

  logStep("Validation passed");
}

main().catch((error) => {
  console.error(`\n[validate:extension] FAILED: ${error.message}`);
  process.exitCode = 1;
});
