import { Button } from "@repo/ui/components/ui/button";
import { AuthContainer } from "../../../../auth/auth-container";
import { useState } from "react";

export const LoginProtected = ({
  message = "This feature is only available to non-guest users.",
}: {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <AuthContainer
            defaultMode="login"
            onClose={() => setIsAuthOpen(false)}
          />
        </div>
      )}
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

  const handleOpen = () => {
    localStorage.setItem("meelio:migrate_guest", "true");
    setIsAuthOpen(true);
  };

  return (
    <>
      <button onClick={handleOpen} className={className}>
        {children}
      </button>
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <AuthContainer
            defaultMode="login"
            onClose={() => setIsAuthOpen(false)}
          />
        </div>
      )}
    </>
  );
};
