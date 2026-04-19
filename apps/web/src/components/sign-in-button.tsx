import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authClient } from "@/lib/auth-client";

const isDedicatedAuthRoute = (pathname: string) =>
  pathname === "/sign-in" || pathname.startsWith("/auth/");

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

  if (isSignedIn !== false) return null;
  if (isDedicatedAuthRoute(location.pathname)) return null;

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
