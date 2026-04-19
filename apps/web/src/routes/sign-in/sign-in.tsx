import { authClient } from "@/auth";

const SignIn = () => {
  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/`,
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div className="rounded-2xl bg-white/5 p-8 backdrop-blur">
        <h1 className="mb-6 text-2xl font-medium">Welcome to Meelio</h1>
        <button
          type="button"
          onClick={handleSignIn}
          className="rounded-lg bg-white px-6 py-3 text-black hover:bg-white/90"
        >
          Sign in with Google
        </button>
      </div>
    </main>
  );
};

export default SignIn;
