import { rm } from "node:fs/promises";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { tempDirCleanupTimeoutMs } from "./config.mjs";
import { sleep } from "./utils.mjs";

export function createTemporaryDirectory(prefix) {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function createValidationExtensionDir(sourceDir) {
  const validationDir = createTemporaryDirectory("meelio-extension-");
  cpSync(sourceDir, validationDir, { recursive: true });
  return validationDir;
}

export function patchManifestForValidation(extensionDir) {
  const manifestPath = path.join(extensionDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const requiredOrigins = ["http://*/*", "https://*/*"];
  const hostPermissions = new Set(manifest.host_permissions ?? []);

  for (const origin of requiredOrigins) {
    hostPermissions.add(origin);
  }

  manifest.host_permissions = [...hostPermissions];
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

export async function removeDirBestEffort(directory) {
  const deadline = Date.now() + tempDirCleanupTimeoutMs;

  while (Date.now() < deadline) {
    try {
      await rm(directory, {
        force: true,
        recursive: true,
        maxRetries: 10,
        retryDelay: 100,
      });
      return;
    } catch (error) {
      const code = error?.code;
      if (
        code !== "ENOTEMPTY" &&
        code !== "EBUSY" &&
        code !== "EPERM" &&
        code !== "EMFILE"
      ) {
        throw error;
      }

      await sleep(250);
    }
  }

  process.stderr.write(
    `[validate:extension] Warning: unable to fully remove temporary directory ${directory}\n`
  );
}

export function removeDirOnExit(directory) {
  try {
    rmSync(directory, {
      force: true,
      recursive: true,
      maxRetries: 2,
      retryDelay: 50,
    });
  } catch {
    // Best-effort exit cleanup only.
  }
}
