import { spawn } from "node:child_process";

import { repoRoot } from "./config.mjs";

export function logStep(message) {
  const validationName = process.env.MEELIO_VALIDATION_NAME ?? "validate:extension";
  process.stdout.write(`\n[${validationName}] ${message}\n`);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runCommand(command, args, options = {}) {
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

export async function waitFor(description, task, predicate, timeoutMs = 15000) {
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
