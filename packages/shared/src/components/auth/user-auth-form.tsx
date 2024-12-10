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

type FormData = z.infer<typeof userAuthSchema>;

export const UserAuthForm = () => {
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
          <button className={cn(buttonVariants())} disabled={isLoading}>
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
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        type="button"
        onClick={handleGoogleClick}
        className={cn(buttonVariants({ size: "lg", variant: "default" }))}
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}{" "}
        Google
      </Button>
    </>
  );
};
