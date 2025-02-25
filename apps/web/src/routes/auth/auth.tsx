import { useSearchParams } from "react-router-dom";
import { AuthContainer } from "@repo/shared";
import { AuthLayout } from "@/layouts/auth-layout";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") as "login"  | "guest" | null;

  return (
    <AuthLayout>
      <AuthContainer defaultMode={mode || "login"} />
    </AuthLayout>
  );
};

export default Auth; 