import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";

const STORAGE_KEY = "meelio:auth:ext-handoff";
const TRIES_KEY = "meelio:auth:ext-handoff-tries";
const MAX_TRIES = 2;
const AUTO_CLOSE_DELAY_MS = 1500;

type HandoffParams = { extId: string; nonce: string };

const AuthExtension = () => {
  const [status, setStatus] = useState<"loading" | "signed-in" | "minted" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void run();

    async function run() {
      try {
        const oauthError = readOAuthError();
        if (oauthError) {
          setStatus("error");
          setError(`Sign-in declined: ${oauthError}`);
          clearHandoffStash();
          return;
        }

        const params = readAndPersistParams();
        if (!params) {
          setStatus("error");
          setError("Missing ext_id or nonce");
          return;
        }

        const session = await authClient.getSession();
        if (!session.data) {
          if (oauthRetryBudgetExhausted()) {
            setStatus("error");
            setError("Couldn't establish a session. Please try again from the extension.");
            clearHandoffStash();
            return;
          }
          incrementOAuthTries();
          await authClient.signIn.social({
            provider: "google",
            callbackURL: window.location.href,
          });
          return;
        }
        setStatus("signed-in");

        const token = await mintExtensionToken();
        if (!token.ok) {
          setStatus("error");
          setError(token.error);
          return;
        }

        sendTokenToExtension(params, token.value, {
          onSuccess: () => {
            setStatus("minted");
            clearHandoffStash();
            setTimeout(closeWindowSafely, AUTO_CLOSE_DELAY_MS);
          },
          onError: (message) => {
            setStatus("error");
            setError(message);
          },
        });
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 text-center text-white">
      {status === "loading" && <p>Connecting…</p>}
      {status === "signed-in" && <p>Signed in. Generating extension token…</p>}
      {status === "minted" && (
        <>
          <h1 className="text-2xl font-medium">You're signed in</h1>
          <p className="text-sm opacity-70">Closing this window…</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl font-medium">Sign-in failed</h1>
          <p className="text-sm opacity-70">{error}</p>
        </>
      )}
    </main>
  );
};

function readOAuthError(): string | null {
  return new URL(window.location.href).searchParams.get("error");
}

function readAndPersistParams(): HandoffParams | null {
  const url = new URL(window.location.href);
  const extId = url.searchParams.get("ext_id");
  const nonce = url.searchParams.get("nonce");
  if (extId && nonce) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ extId, nonce }));
    return { extId, nonce };
  }
  const stashed = sessionStorage.getItem(STORAGE_KEY);
  if (!stashed) return null;
  try {
    return JSON.parse(stashed) as HandoffParams;
  } catch {
    return null;
  }
}

function oauthRetryBudgetExhausted(): boolean {
  return Number(sessionStorage.getItem(TRIES_KEY) ?? "0") >= MAX_TRIES;
}

function incrementOAuthTries(): void {
  const current = Number(sessionStorage.getItem(TRIES_KEY) ?? "0");
  sessionStorage.setItem(TRIES_KEY, String(current + 1));
}

type MintResult = { ok: true; value: string } | { ok: false; error: string };

async function mintExtensionToken(): Promise<MintResult> {
  const apiBase = (import.meta.env.VITE_API_URL ?? "http://localhost:8787") as string;
  const res = await fetch(`${apiBase}/api/auth/token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose: "extension" }),
  });
  if (!res.ok) return { ok: false, error: `Token mint failed: ${res.status}` };
  const { token } = (await res.json()) as { token: string };
  return { ok: true, value: token };
}

function sendTokenToExtension(
  params: HandoffParams,
  token: string,
  callbacks: { onSuccess: () => void; onError: (message: string) => void }
): void {
  const chromeApi = (globalThis as { chrome?: typeof chrome }).chrome;
  if (!chromeApi?.runtime?.sendMessage) {
    callbacks.onError("chrome.runtime not available — open this from a Chromium browser");
    return;
  }

  chromeApi.runtime.sendMessage(
    params.extId,
    { type: "AUTH_TOKEN", token, nonce: params.nonce },
    () => {
      const lastError = chromeApi.runtime.lastError;
      if (lastError) {
        const friendly = lastError.message?.includes("Receiving end does not exist")
          ? "Couldn't reach the Meelio extension — make sure it's installed and enabled."
          : (lastError.message ?? "sendMessage failed");
        callbacks.onError(friendly);
        return;
      }
      callbacks.onSuccess();
    },
  );
}

function closeWindowSafely(): void {
  try {
    window.close();
  } catch {
    // Some browser contexts disallow window.close(); UI fallback covers this.
  }
}

function clearHandoffStash() {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(TRIES_KEY);
}

export default AuthExtension;
