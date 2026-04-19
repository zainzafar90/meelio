import { useExtensionHandoff, type HandoffState } from "./use-extension-handoff";

const COPY: Record<HandoffState, { title?: string; message: string }> = {
  connecting: { message: "Connecting…" },
  minting: { message: "Signed in. Generating extension token…" },
  delivered: { title: "You're signed in", message: "Closing this window…" },
  failed: { title: "Sign-in failed", message: "" },
};

const AuthExtension = () => {
  const { state, error } = useExtensionHandoff();
  const copy = COPY[state];
  const message = state === "failed" ? (error ?? "Unknown error") : copy.message;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-950 text-center text-white">
      {copy.title && <h1 className="text-2xl font-medium">{copy.title}</h1>}
      <p className="text-sm opacity-70">{message}</p>
    </main>
  );
};

export default AuthExtension;
