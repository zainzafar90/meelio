import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import { Icons } from "../icons/icons";
import { cn } from "@repo/ui/lib/utils";
import { buttonVariants } from "@repo/ui/components/ui/button";
import { createGuestUser } from "../../api/auth.api";
import { useAuthStore } from "../../stores/auth.store";
import { toast } from "sonner";

export const GuestAuthForm = () => {
  const navigate = useNavigate();
  const authenticate = useAuthStore((state) => state.authenticate);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsLoading(true);
    try {
      const { data: user } = await createGuestUser({
        name: name.trim(),
      });
      authenticate(user);
      toast.success("Welcome to Meelio!");
      navigate("/");
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Unable to create guest account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
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
            disabled={isLoading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.length === 0) {
                setNameError("Name is required");
              }
            }}
          />
          {nameError && (
            <p className="px-1 text-xs text-red-600">{nameError}</p>
          )}
        </div>
        <Button
          className={cn(buttonVariants({ size: "lg" }), "mt-2")}
          disabled={isLoading}
        >
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </div>
    </form>
  );
};
