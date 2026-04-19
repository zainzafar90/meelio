import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

const STORAGE_KEY = "meelio:ext-handoff";
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8787";

const AuthExtension = () => {
  const [status, setStatus] = useState<"loading" | "minted" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    handoff().then(
      (done) => {
        if (cancelled || !done) return;
        setStatus("minted");
        setTimeout(() => window.close(), 1000);
      },
      (err) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-950 text-center text-white">
      {status === "loading" && <p>Connecting…</p>}
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

async function handoff(): Promise<boolean> {
  const params = readParams();
  if (!params) throw new Error("Missing ext_id or nonce");

  const session = await authClient.getSession();
  if (!session.data) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    await authClient.signIn.social({ provider: "google", callbackURL: window.location.href });
    return false;
  }

  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose: "extension" }),
  });
  if (!res.ok) throw new Error(`Token mint failed (${res.status})`);
  const { token } = (await res.json()) as { token: string };

  await sendToExtension(params.extId, params.nonce, token);
  sessionStorage.removeItem(STORAGE_KEY);
  return true;
}

function readParams(): { extId: string; nonce: string } | null {
  const url = new URL(window.location.href);
  const extId = url.searchParams.get("ext_id");
  const nonce = url.searchParams.get("nonce");
  if (extId && nonce) return { extId, nonce };
  const stashed = sessionStorage.getItem(STORAGE_KEY);
  if (!stashed) return null;
  try {
    return JSON.parse(stashed) as { extId: string; nonce: string };
  } catch {
    return null;
  }
}

function sendToExtension(extId: string, nonce: string, token: string): Promise<void> {
  const chromeApi = (globalThis as { chrome?: typeof chrome }).chrome;
  if (!chromeApi?.runtime?.sendMessage) {
    return Promise.reject(new Error("Open this page in a Chromium browser with the Meelio extension installed."));
  }
  return new Promise((resolve, reject) => {
    chromeApi.runtime.sendMessage(extId, { type: "AUTH_TOKEN", token, nonce }, () => {
      const err = chromeApi.runtime.lastError;
      if (!err) return resolve();
      reject(new Error(err.message?.includes("Receiving end does not exist")
        ? "Couldn't reach the Meelio extension — make sure it's installed and enabled."
        : (err.message ?? "Failed to deliver token to extension")));
    });
  });
}

export default AuthExtension;
