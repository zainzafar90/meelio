import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8787";

const AuthExtension = () => {
  const [message, setMessage] = useState("Connecting…");

  useEffect(() => {
    signInExtension()
      .then(() => {
        setMessage("Signed in. Closing…");
        setTimeout(() => window.close(), 1000);
      })
      .catch((err: unknown) => {
        setMessage(err instanceof Error ? err.message : "Sign-in failed.");
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-center text-white">
      <p className="text-sm opacity-70">{message}</p>
    </main>
  );
};

async function signInExtension() {
  const url = new URL(window.location.href);
  const extId = url.searchParams.get("ext_id");
  const nonce = url.searchParams.get("nonce");
  if (!extId || !nonce) throw new Error("Missing extension ID or nonce.");

  const { data: session } = await authClient.getSession();
  if (!session) {
    return authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.href,
    });
  }

  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose: "extension" }),
  });
  if (!res.ok) throw new Error(`Couldn't mint token (${res.status}).`);
  const { token } = (await res.json()) as { token: string };

  await chrome.runtime.sendMessage(extId, { type: "AUTH_TOKEN", token, nonce });
}

export default AuthExtension;
