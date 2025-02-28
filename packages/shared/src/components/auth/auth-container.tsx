import { useState } from "react";
import { Logomark } from "../common/logo";
import { UserAuthForm } from "./user-auth-form";
import { GuestAuthForm } from "./guest-auth-form";
import { AuthLayout } from "./auth-layout";

type AuthMode = "login" | "register" | "guest";

interface AuthContainerProps {
  defaultMode?: AuthMode;
}

export const AuthContainer = ({
  defaultMode = "login",
}: AuthContainerProps) => {
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  const renderForm = () => {
    switch (mode) {
      case "login":
        return <UserAuthForm />;
      case "guest":
        return <GuestAuthForm />;
    }
  };

  const renderLinks = () => {
    switch (mode) {
      case "login":
        return (
          <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
            <button
              onClick={() => setMode("guest")}
              className="hover:text-brand underline underline-offset-4"
            >
              Continue as Guest
            </button>
          </div>
        );
      case "guest":
        return (
          <div className="text-center text-sm text-muted-foreground">
            <button
              onClick={() => setMode("login")}
              className="hover:text-brand underline underline-offset-4"
            >
              Have an account? Sign in
            </button>
          </div>
        );
    }
  };

  return (
    <div className="dark z-10 m-16 fixed inset-0 max-w-4xl mx-auto overflow-hidden">
      <AuthLayout>
        <div className="flex items-center justify-center">
          <div className="flex flex-col justify-center items-center gap-y-8 max-w-96 w-full">
            <Logomark className="text-background dark:text-foreground inline-block w-32" />
            <div className="mx-auto flex w-full flex-col justify-center space-y-6">
              <h1 className="mt-4 font-heading text-xl/relaxed font-light bg-gradient-to-r from-red-400 via-orange-300 to-yellow-200 inline-block text-transparent bg-clip-text text-center">
                Elevate Focus, Boost Productivity
              </h1>
              <p className="mt-4 text-sm/6 text-gray-300 text-center">
                Meelio is a minimalist app built for productivity. Its calm
                design helps you focus and work efficiently.
              </p>

              {renderForm()}

              {renderLinks()}
            </div>
          </div>
        </div>
      </AuthLayout>
    </div>
  );
};
