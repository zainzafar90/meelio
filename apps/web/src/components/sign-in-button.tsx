import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authClient } from "@/lib/auth-client";

/**
 * Subtle floating sign-in affordance for the web app. Renders ONLY when:
 * - The user is confirmed signed-out (validated against /api/auth/get-session)
 * - The current route is NOT /sign-in or /auth/extension (those are dedicated
 *   auth pages — a button would be redundant there)
 *
 * Auth is opt-in: nothing on the web app is gated on this.
 */
export const SignInButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void authClient.getSession().then((result) => {
      if (cancelled) return;
      setIsSignedIn(result.data !== null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Render nothing while initial session check is in flight (no flash for signed-in users).
  if (isSignedIn !== false) return null;

  // Don't render on dedicated auth pages.
  if (location.pathname === "/sign-in" || location.pathname.startsWith("/auth/")) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate("/sign-in")}
      className="fixed right-4 top-4 z-50 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
      aria-label="Sign in"
    >
      Sign in
    </button>
  );
};
