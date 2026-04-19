import { useEffect, useState } from "react";

import { signOut } from "./auth-client";
import { bearerStore } from "./bearer-store";
import { startSignIn } from "./extension-sign-in";

export const AuthButton = () => {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const refresh = () => {
      void bearerStore.getToken().then((t) => setSignedIn(t !== null));
    };
    refresh();

    const onMessage = (msg: { type?: string }) => {
      if (msg?.type === "MEELIO_AUTH_STATE_CHANGED") refresh();
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  if (signedIn === null) return null;

  const handleClick = async () => {
    if (signedIn) {
      await signOut();
      setSignedIn(false);
      return;
    }
    await startSignIn();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed right-4 top-4 z-50 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black shadow-lg transition hover:bg-white/90"
    >
      {signedIn ? "Sign out" : "Sign in with Google"}
    </button>
  );
};
