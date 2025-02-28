import { Button } from "@repo/ui/components/ui/button";
import { AuthContainer } from "../../../../auth/auth-container";
import { useState } from "react";

export const LoginProtected = ({
  children,
  message = "This feature is only available to non-guest users.",
}: {
  children: React.ReactNode;
  message?: string;
}) => {
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-4 h-full items-center justify-center">
      {message}
      <LoginButton>
        <Button>Login</Button>
      </LoginButton>
      {isAuthOpen && (
        <AuthContainer
          defaultMode="login"
          onClose={() => setIsAuthOpen(false)}
        />
      )}
      {children}
    </div>
  );
};

export const LoginButton = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  return (
    <>
      <button onClick={() => setIsAuthOpen(true)} className={className}>
        {children}
      </button>
      {isAuthOpen && (
        <AuthContainer
          defaultMode="login"
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </>
  );
};
