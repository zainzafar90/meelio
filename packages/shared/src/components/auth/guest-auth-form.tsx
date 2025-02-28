import { useEffect } from "react";
import { Icons } from "../icons/icons";
import { useAuthStore } from "../../stores/auth.store";
import { toast } from "sonner";
import { GuestUser } from "src/types";

interface GuestAuthFormProps {
  initialName: string;
}

export const GuestAuthForm = ({ initialName }: GuestAuthFormProps) => {
  const authenticateGuest = useAuthStore((state) => state.authenticateGuest);

  const handleGuestLogin = async () => {
    try {
      const guestUser: GuestUser = {
        id: `guest-${Date.now()}`,
        name: initialName,
        role: "guest",
        createdAt: new Date().toISOString(),
      };

      await new Promise((resolve) => setTimeout(resolve, 500));

      authenticateGuest(guestUser);

      toast.success(`Welcome, ${initialName}!`, {
        description:
          "You're using Meelio as a guest. Your data will be stored locally.",
      });
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Unable to create guest account. Please try again.",
      });
    }
  };

  useEffect(() => {
    handleGuestLogin();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-medium">Setting up your guest account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please wait while we prepare your workspace...
        </p>
      </div>
      <div className="flex items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );
};
