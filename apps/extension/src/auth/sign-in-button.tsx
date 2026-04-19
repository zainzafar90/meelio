import { startHandoff } from "./extension-handoff";
import { useBearerAuth } from "./use-bearer-auth";

/**
 * Subtle floating sign-in affordance. Renders ONLY when the user is
 * confirmed signed-out — never blocks the dashboard. Auth is opt-in:
 * the new-tab experience works fully without an account.
 */
export const SignInButton = () => {
  const { hasToken } = useBearerAuth();

  // While initial read is in flight, render nothing (no flash for signed-in users).
  // Once confirmed signed-in, render nothing.
  if (hasToken !== false) return null;

  return (
    <button
      type="button"
      onClick={() => void startHandoff()}
      className="fixed right-4 top-4 z-50 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
      aria-label="Sign in with Google"
    >
      Sign in
    </button>
  );
};
