import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";

import { clearHandoffParams, readHandoffParams, type HandoffParams } from "./handoff-params";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8787") as string;
const AUTO_CLOSE_DELAY_MS = 1500;

export type HandoffState = "connecting" | "minting" | "delivered" | "failed";

export type Handoff = {
  state: HandoffState;
  error: string | null;
};

export function useExtensionHandoff(): Handoff {
  const [state, setState] = useState<HandoffState>("connecting");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void runHandoff()
      .then((result) => {
        if (result.ok) {
          setState("delivered");
          clearHandoffParams();
          window.setTimeout(() => closeWindowSafely(), AUTO_CLOSE_DELAY_MS);
        } else {
          setState("failed");
          setError(result.error);
          if (result.terminal) clearHandoffParams();
        }
      })
      .catch((err: unknown) => {
        setState("failed");
        setError(err instanceof Error ? err.message : "Unknown error");
      });
  }, []);

  return { state, error };
}

type HandoffResult =
  | { ok: true }
  | { ok: false; error: string; terminal: boolean };

async function runHandoff(): Promise<HandoffResult> {
  const oauthError = new URL(window.location.href).searchParams.get("error");
  if (oauthError) return { ok: false, error: `Sign-in declined: ${oauthError}`, terminal: true };

  const params = readHandoffParams();
  if (!params) return { ok: false, error: "Missing ext_id or nonce", terminal: true };

  const session = await authClient.getSession();
  if (!session.data) {
    await authClient.signIn.social({ provider: "google", callbackURL: window.location.href });
    return { ok: false, error: "Redirecting to sign in…", terminal: false };
  }

  const token = await mintExtensionToken();
  await deliverTokenToExtension(params, token);
  return { ok: true };
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

function deliverTokenToExtension(params: HandoffParams, token: string): Promise<void> {
  const chromeApi = (globalThis as { chrome?: typeof chrome }).chrome;
  if (!chromeApi?.runtime?.sendMessage) {
    return Promise.reject(new Error("chrome.runtime not available — open this from a Chromium browser"));
  }
  return new Promise((resolve, reject) => {
    chromeApi.runtime.sendMessage(
      params.extId,
      { type: "AUTH_TOKEN", token, nonce: params.nonce },
      () => {
        const lastError = chromeApi.runtime.lastError;
        if (!lastError) return resolve();
        reject(new Error(friendlyMessageError(lastError.message)));
      },
    );
  });
}

function friendlyMessageError(message?: string): string {
  if (message?.includes("Receiving end does not exist")) {
    return "Couldn't reach the Meelio extension — make sure it's installed and enabled.";
  }
  return message ?? "sendMessage failed";
}

function closeWindowSafely(): void {
  try {
    window.close();
  } catch {
    /* some browsers refuse window.close — UI fallback covers this */
  }
}
