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

type AuthMode = "name" | "login" | "guest";

interface AuthContainerProps {
  defaultMode?: AuthMode;
  onClose?: () => void;
}

export const AuthContainer = (props: AuthContainerProps) => {
  const { defaultMode = "name" } = props;
  const { authenticateGuest } = useAuthStore((state) => ({
    authenticateGuest: state.authenticateGuest,
  }));

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [name, setName] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Please enter your name");
      return;
    }
    setMode("login");
  };

  const handleContinueAsGuest = async () => {
    try {
      setMode("guest");
      localStorage.setItem("meelio:local:name", JSON.stringify(name));

      const guestUser: GuestUser = {
        id: `guest-${Date.now()}`,
        name,
        role: "guest",
        createdAt: new Date().toISOString(),
      };

      authenticateGuest(guestUser);

      toast.success(`Welcome, ${name}!`, {
        description:
          "You're using Meelio as a guest. Your data will be stored locally.",
      });
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Unable to create guest account. Please try again.",
      });
    }
  };

  const renderNameForm = () => {
    return (
      <form onSubmit={handleNameSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="name">
              Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your name"
              type="text"
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (!name.trim()) {
                  setNameError("Name is required");
                } else {
                  setNameError("");
                }
              }}
            />
            {nameError && (
              <p className="px-1 text-xs text-red-600">{nameError}</p>
            )}
          </div>
          <Button className={cn(buttonVariants({ size: "lg" }), "mt-2")}>
            Continue
          </Button>
        </div>
      </form>
    );
  };

  const renderForm = () => {
    switch (mode) {
      case "name":
        return renderNameForm();
      case "login":
        return (
          <UserAuthForm
            userName={name}
            onGuestContinue={handleContinueAsGuest}
          />
        );
    }
  };

  return (
    <div className="dark z-10 m-16 fixed inset-0 max-w-4xl mx-auto overflow-hidden">
      <AuthLayout>
        {props.onClose && (
          <button
            className="absolute top-4 right-4 z-10 rounded-full bg-zinc-800/50 p-2 hover:bg-zinc-800"
            onClick={() => props.onClose?.()}
          >
            <Icons.close className="h-4 w-4 text-white/80" />
          </button>
        )}
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
            </div>
          </div>
        </div>
      </AuthLayout>
    </div>
  );
};
