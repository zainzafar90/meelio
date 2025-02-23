import { useAuthStore } from "../../../../stores/auth.store";

import { BillingForm } from "../components/billing/billing-form";
import { LoginProtected } from "../components/common/login-protected";

export const BillingSettings = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) return <LoginProtected />;

  return <BillingForm user={user} />;
};
