import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

const STORAGE_KEY = "meelio:ext-handoff";
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8787";
const AUTO_CLOSE_DELAY_MS = 1000;

type Params = { extId: string; nonce: string };
type Status = "connecting" | "delivered" | "failed";

const AuthExtension = () => {
  const { status, error } = useExtensionHandoff();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-950 text-center text-white">
      {status === "connecting" && <p>Connecting…</p>}
      {status === "delivered" && (
        <>
          <h1 className="text-2xl font-medium">You're signed in</h1>
          <p className="text-sm opacity-70">Closing this window…</p>
        </>
      )}
      {status === "failed" && (
        <>
          <h1 className="text-2xl font-medium">Sign-in failed</h1>
          <p className="text-sm opacity-70">{error}</p>
        </>
      )}
    </main>
  );
};

function useExtensionHandoff() {
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    runHandoff().then(
      (delivered) => {
        if (cancelled || !delivered) return;
        setStatus("delivered");
        window.setTimeout(() => closeWindowSafely(), AUTO_CLOSE_DELAY_MS);
      },
      (err: unknown) => {
        if (cancelled) return;
        setStatus("failed");
        setError(err instanceof Error ? err.message : "Unknown error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, error };
}

async function runHandoff(): Promise<boolean> {
  const params = readParams(new URL(window.location.href));
  if (!params) throw new Error("Missing ext_id or nonce");

  const session = await authClient.getSession();
  if (!session.data) {
    persistParams(params);
    await authClient.signIn.social({ provider: "google", callbackURL: window.location.href });
    return false;
  }

  const token = await mintExtensionToken();
  await sendTokenToExtension(params, token);
  clearPersistedParams();
  return true;
}

// ── Pure ──────────────────────────────────────────────────────────────────────

function readParams(url: URL): Params | null {
  const fromUrl = paramsFromUrl(url);
  if (fromUrl) return fromUrl;
  return paramsFromSessionStorage();
}

function paramsFromUrl(url: URL): Params | null {
  const extId = url.searchParams.get("ext_id");
  const nonce = url.searchParams.get("nonce");
  return extId && nonce ? { extId, nonce } : null;
}

function paramsFromSessionStorage(): Params | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Params;
  } catch {
    return null;
  }
}

function friendlyChromeError(message: string | undefined): string {
  if (message?.includes("Receiving end does not exist")) {
    return "Couldn't reach the Meelio extension — make sure it's installed and enabled.";
  }
  return message ?? "Failed to deliver token to extension.";
}

// ── Side effects ──────────────────────────────────────────────────────────────

function persistParams(params: Params): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
}

function clearPersistedParams(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

async function mintExtensionToken(): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose: "extension" }),
  });
  if (!res.ok) throw new Error(`Token mint failed (${res.status})`);
  const body = (await res.json()) as { token: string };
  return body.token;
}

function sendTokenToExtension(params: Params, token: string): Promise<void> {
  const chromeApi = (globalThis as { chrome?: typeof chrome }).chrome;
  if (!chromeApi?.runtime?.sendMessage) {
    return Promise.reject(new Error("Open this page in a Chromium browser with the Meelio extension installed."));
  }
  return new Promise((resolve, reject) => {
    chromeApi.runtime.sendMessage(params.extId, { type: "AUTH_TOKEN", token, nonce: params.nonce }, () => {
      const err = chromeApi.runtime.lastError;
      if (!err) return resolve();
      reject(new Error(friendlyChromeError(err.message)));
    });
  });
}

function closeWindowSafely(): void {
  try {
    window.close();
  } catch {
    /* some browser contexts disallow window.close — UI fallback covers this */
  }
}

export default AuthExtension;
