import { useAuthStore } from "../../../../stores/auth.store";
import { useShallow } from "zustand/shallow";
import { BillingForm } from "../components/billing/billing-form";
import { LoginProtected } from "../components/common/login-protected";

export const BillingSettings = () => {
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  if (!user) return <LoginProtected />;

  return <BillingForm user={user} />;
};
