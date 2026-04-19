import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";

const STORAGE_KEY = "meelio:auth:ext-handoff";
const TRIES_KEY = "meelio:auth:ext-handoff-tries";
const MAX_TRIES = 2; // initial + one OAuth retry
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
        // OAuth-denial loop guard — if Google sent us back with an error, surface it and stop
        const url = new URL(window.location.href);
        if (url.searchParams.get("error")) {
          setStatus("error");
          setError(`Sign-in declined: ${url.searchParams.get("error")}`);
          clearHandoffStash();
          return;
        }

        // (a) Stash params (survives OAuth round trip)
        const params = readAndPersistParams();
        if (!params) {
          setStatus("error");
          setError("Missing ext_id or nonce");
          return;
        }

        // (b) Check session — if not signed in, redirect through OAuth back to here
        const session = await authClient.getSession();
        if (!session.data) {
          const tries = Number(sessionStorage.getItem(TRIES_KEY) ?? "0");
          if (tries >= MAX_TRIES) {
            setStatus("error");
            setError("Couldn't establish a session. Please try again from the extension.");
            clearHandoffStash();
            return;
          }
          sessionStorage.setItem(TRIES_KEY, String(tries + 1));
          await authClient.signIn.social({
            provider: "google",
            callbackURL: window.location.href,
          });
          return;
        }
        setStatus("signed-in");

        // (c) Mint bearer (cookie-authenticated POST)
        const apiBase = (import.meta.env.VITE_API_URL ?? "http://localhost:8787") as string;
        const res = await fetch(`${apiBase}/api/auth/token`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose: "extension" }),
        });
        if (!res.ok) {
          setStatus("error");
          setError(`Token mint failed: ${res.status}`);
          return;
        }
        const { token } = (await res.json()) as { token: string };

        // (d) Hand off to extension
        const chromeApi = (globalThis as { chrome?: typeof chrome }).chrome;
        if (!chromeApi?.runtime?.sendMessage) {
          setStatus("error");
          setError("chrome.runtime not available — open this from a Chromium browser");
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
              setStatus("error");
              setError(friendly);
              return;
            }
            setStatus("minted");
            clearHandoffStash();
            // Auto-close the popup window so the user returns to their extension new tab.
            setTimeout(() => {
              try {
                window.close();
              } catch {
                // window.close() can fail in some contexts; UI fallback below tells user.
              }
            }, AUTO_CLOSE_DELAY_MS);
          },
        );
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

function clearHandoffStash() {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(TRIES_KEY);
}

export default AuthExtension;
