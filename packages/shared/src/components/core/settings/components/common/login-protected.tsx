import { Button } from "@repo/ui/components/ui/button";
import { AuthContainer } from "../../../../auth/auth-container";
import { useState } from "react";

export const LoginProtected = () => {
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-4 h-full items-center justify-center">
      This feature is only available to non-guest users.
      <Button onClick={() => setIsAuthOpen(true)}>Login</Button>
      {isAuthOpen && (
        <AuthContainer
          defaultMode="login"
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
};
