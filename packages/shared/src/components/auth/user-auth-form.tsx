import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Icons } from "../icons/icons";
import { cn } from "../../lib/utils";
import { api } from "../../api";
import { env } from "../../utils";
import { userAuthSchema } from "../../lib/validations/auth";
import { useAuthStore } from "../../stores/auth.store";
import { useShallow } from "zustand/shallow";
import { useTranslation } from "react-i18next";

type FormData = z.infer<typeof userAuthSchema>;

interface UserAuthFormProps {
  userName?: string;
  onGuestContinue: () => void;
  mode?: "default" | "inverted";
  className?: string;
}

export const UserAuthForm = ({
  userName,
  onGuestContinue,
  mode = "default",
  className,
}: UserAuthFormProps) => {
  const { t } = useTranslation();
  const { guestUser } = useAuthStore(
    useShallow((state) => ({
      guestUser: state.guestUser,
    }))
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema as any),
  });

  const handleGoogleClick = async () => {
    setIsGoogleLoading(true);
    window.location.href = `${env.serverUrl}/v1/account/google`;
  };

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      await api.auth.sendMagicLink({
        email: data.email,
        // name: userName, // Pass the name to the magic link API
      });
      toast("We sent you a magic link.", {
        description:
          "Click the secure link, and check your spam folder if you don't see it in your inbox.",
      });
    } catch (error) {
      toast.error("Something went wrong.", {
        description:
          "We are unable to send you a magic link. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {userName && (
        <div className="text-center mb-4">
          <p
            className={cn(
              "text-gray-300 text-base",
              mode === "inverted" && "text-gray-900"
            )}
          >
            Hello <span className="font-semibold">{userName}</span>, how would
            you like to continue?
          </p>
        </div>
      )}
      {!userName && (
        <div className="text-center mb-4">
          <p
            className={cn(
              "text-gray-300 text-base",
              mode === "inverted" && "text-gray-900"
            )}
          >
            How would you like to continue?
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading || isGoogleLoading}
              {...register("email")}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
          <button
            className={cn(
              buttonVariants({ size: "lg", variant: "default" }),
              mode === "inverted" &&
                "bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
            )}
            disabled={isLoading}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In with Email
          </button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span
            className={cn(
              "px-2 text-muted-foreground bg-gray-900",
              mode === "inverted" && "text-gray-900 bg-white"
            )}
          >
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid gap-6">
        <Button
          type="button"
          onClick={handleGoogleClick}
          className={cn(
            buttonVariants({ size: "lg", variant: "default" }),
            mode === "inverted" &&
              "bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
          )}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}{" "}
          Google
        </Button>
        {!guestUser && (
          <Button
            type="button"
            onClick={onGuestContinue}
            className={cn(
              buttonVariants({ size: "lg", variant: "default" }),
              "bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white shadow-sm"
            )}
          >
            Guest Mode
          </Button>
        )}
      </div>
    </>
  );
};
