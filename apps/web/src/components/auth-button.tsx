import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

export const AuthButton = () => {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    authClient.getSession().then((s) => setSignedIn(s.data !== null));
  }, []);

  if (signedIn === null) return null;

  const handleClick = async () => {
    if (signedIn) {
      await authClient.signOut();
      setSignedIn(false);
      return;
    }
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/`,
    });
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
