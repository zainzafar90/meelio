import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";

import {
  blockedPageSuffix,
  browserCandidates,
  blockerPattern,
  extensionOutputDir,
  isCi,
  pregrantBlockerAccess,
  repoRoot,
  validationLocale,
} from "./config.mjs";
import { connectToTarget, CdpClient, waitForDebugger, waitForTarget } from "./cdp.mjs";
import {
  createTemporaryDirectory,
  createValidationExtensionDir,
  patchManifestForValidation,
  removeDirBestEffort,
  removeDirOnExit,
} from "./temp-artifacts.mjs";
import { assert, sleep } from "./utils.mjs";

export function findBrowserBinary() {
  const binary = browserCandidates.find((candidate) => existsSync(candidate));
  assert(
    binary,
    "No supported browser binary found. Set MEELIO_BROWSER_PATH to Edge or Chrome."
  );
  return binary;
}

export async function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => {
          reject(new Error("Unable to reserve a remote debugging port for the browser."));
        });
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
  });
}

function trackBrowserOutput(browserProcess, browserState) {
  browserProcess.stdout?.setEncoding("utf8");
  browserProcess.stderr?.setEncoding("utf8");
  browserProcess.stdout?.on("data", (chunk) => {
    browserState.stdout = `${browserState.stdout}${chunk}`.slice(-8000);
  });
  browserProcess.stderr?.on("data", (chunk) => {
    browserState.stderr = `${browserState.stderr}${chunk}`.slice(-16000);
  });
  browserProcess.on("exit", (code, signal) => {
    browserState.exitCode = code;
    browserState.signal = signal;
  });
}

async function waitForBrowserExit(browserProcess, timeoutMs) {
  if (browserProcess.exitCode !== null) {
    return;
  }

  await Promise.race([
    new Promise((resolve) => browserProcess.once("exit", resolve)),
    sleep(timeoutMs),
  ]);
}

export async function launchBrowserSession() {
  const browserBinary = findBrowserBinary();
  const port = await getAvailablePort();
  const profileDir = createTemporaryDirectory("meelio-validate-");
  const validationExtensionDir = createValidationExtensionDir(extensionOutputDir);

  if (pregrantBlockerAccess) {
    patchManifestForValidation(validationExtensionDir);
  }

  const browserState = {
    exitCode: null,
    signal: null,
    stderr: "",
    stdout: "",
  };
  const browserFlags = [
    `--user-data-dir=${profileDir}`,
    `--disable-extensions-except=${validationExtensionDir}`,
    `--load-extension=${validationExtensionDir}`,
    `--remote-debugging-port=${port}`,
    "--remote-debugging-address=127.0.0.1",
    `--lang=${validationLocale}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--new-window",
    "about:blank",
  ];

  if (process.platform === "linux") {
    browserFlags.push("--no-sandbox", "--disable-setuid-sandbox");
  }

  if (isCi) {
    browserFlags.push(
      "--disable-dev-shm-usage",
      "--disable-background-networking",
      "--enable-logging=stderr"
    );
  }

  const browserProcess = spawn(browserBinary, browserFlags, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });
  trackBrowserOutput(browserProcess, browserState);

  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;

    if (browserProcess.exitCode === null) {
      browserProcess.kill("SIGTERM");
      await waitForBrowserExit(browserProcess, 2000);
    }

    if (browserProcess.exitCode === null) {
      browserProcess.kill("SIGKILL");
      await waitForBrowserExit(browserProcess, 1000);
    }

    await removeDirBestEffort(profileDir);
    await removeDirBestEffort(validationExtensionDir);
  };

  process.on("exit", () => {
    removeDirOnExit(profileDir);
    removeDirOnExit(validationExtensionDir);
  });
  process.on("SIGINT", () => {
    void cleanup().finally(() => process.exit(130));
  });
  process.on("SIGTERM", () => {
    void cleanup().finally(() => process.exit(143));
  });

  const version = await waitForDebugger(port, browserState);
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

  return {
    blockedPrefix,
    blockerPattern,
    browserClient,
    cleanup,
    extensionId,
    newtabUrl,
    port,
    pregrantBlockerAccess,
    profileDir,
    workerClient,
  };
}
