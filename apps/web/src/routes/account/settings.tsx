import { AuthUser } from "@/types/auth";
import { AccountForm } from "@/components/account/account-form";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/layouts/app-layout";
import { useAuthStore } from "@/store/auth.store";

const Settings = () => {
  const user = useAuthStore((state) => state.user) || ({} as AuthUser);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Account</h3>
          <p className="font-normal text-sm leading-snug text-foreground/70">
            Manage account and website settings.
          </p>
        </div>
        <Separator />
        <AccountForm user={user} />
      </div>
    </AppLayout>
  );
};

export default Settings;
