import { startHandoff } from "./extension-handoff";
import { useBearerAuth } from "./use-bearer-auth";

export const SignInButton = () => {
  const { hasToken } = useBearerAuth();

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
