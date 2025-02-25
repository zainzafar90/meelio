import { AuthContainer } from "../../../../auth/auth-container";

export const LoginProtected = () => {
  return (
    <div className="flex flex-col gap-4 h-full items-center justify-center">
      <AuthContainer defaultMode="login" />
    </div>
  );
};
