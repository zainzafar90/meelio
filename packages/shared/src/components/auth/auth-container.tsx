import { useState } from "react";
import { Logomark } from "../common/logo";
import { UserAuthForm } from "./user-auth-form";
import { AuthLayout } from "./auth-layout";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "../../lib/utils";
import { buttonVariants } from "@repo/ui/components/ui/button";

import { toast } from "sonner";
import { GuestUser } from "../../types/auth";
import { useAuthStore } from "../../stores/auth.store";
import { Icons } from "../icons";

type AuthMode = "login" | "guest";

interface AuthContainerProps {
  defaultMode?: AuthMode;
  onClose?: () => void;
}

export const AuthContainer = (props: AuthContainerProps) => {
  const { defaultMode = "login" } = props;
  const { user, guestUser, authenticateGuest } = useAuthStore((state) => ({
    user: state.user,
    guestUser: state.guestUser,
    authenticateGuest: state.authenticateGuest,
  }));

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [guestName, setGuestName] = useState<string>(
    user?.name || guestUser?.name || ""
  );
  const [guestNameError, setGuestNameError] = useState<string>("");

  const handleSwitchToGuestMode = () => {
    setMode("guest");
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setGuestNameError("Please enter your name");
      return;
    }

    try {
      localStorage.setItem("meelio:local:name", JSON.stringify(guestName));

      const guestUser: GuestUser = {
        id: `guest-${Date.now()}`,
        name: guestName,
        role: "guest",
        createdAt: new Date().toISOString(),
      };

      authenticateGuest(guestUser);

      toast.info(`Welcome, ${guestName}!`, {
        description:
          "As a guest, your data will be stored locally, and won't be synced across devices.",
        duration: 10000,
        position: "top-center",
      });
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Unable to create guest account. Please try again.",
      });
    }
  };

  const renderGuestForm = () => {
    return (
      <form onSubmit={handleGuestSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <div className="grid gap-1">
            <p className="text-sm text-gray-300 mb-2">
              What should we call you?
            </p>
            <Label className="sr-only" htmlFor="guestName">
              Guest Name
            </Label>
            <Input
              id="guestName"
              placeholder="First name or nickname"
              type="text"
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect="off"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onBlur={() => {
                if (!guestName.trim()) {
                  setGuestNameError("Name is required");
                } else {
                  setGuestNameError("");
                }
              }}
            />
            {guestNameError && (
              <p className="px-1 text-xs text-red-600">{guestNameError}</p>
            )}
          </div>
          <Button className={cn(buttonVariants({ size: "lg" }), "mt-2")}>
            Continue as Guest
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-gray-300 hover:text-white"
            onClick={() => setMode("login")}
          >
            Back
          </Button>
        </div>
      </form>
    );
  };

  const renderForm = () => {
    switch (mode) {
      case "login":
        return <UserAuthForm onGuestContinue={handleSwitchToGuestMode} />;
      case "guest":
        return renderGuestForm();
      default:
        return null;
    }
  };

  return (
    <AuthLayout>
      {props.onClose && (
        <button
          className="absolute top-4 right-4 z-10 rounded-full bg-zinc-800/50 p-2 hover:bg-zinc-800"
          onClick={() => props.onClose?.()}
        >
          <Icons.close className="h-4 w-4 text-white/80" />
        </button>
      )}
      <div className="flex items-center justify-center py-4">
        <div className="flex flex-col justify-center items-center gap-y-8 max-w-96 w-full">
          <Logomark className="text-background dark:text-foreground inline-block w-32" />
          <div className="mx-auto flex w-full flex-col justify-center space-y-2">
            <h1 className="mt-4 font-heading text-lg/relaxed font-light bg-gradient-to-r from-red-400 via-orange-300 to-yellow-200 inline-block text-transparent bg-clip-text text-center">
              Welcome to Meelio
            </h1>
          </div>
          <div className="mx-auto flex w-full flex-col justify-center space-y-4">
            {renderForm()}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
