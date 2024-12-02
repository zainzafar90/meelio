import { VERSION } from "@/version";
import { SidebarMenuButton } from "@repo/ui/components/ui/sidebar";
import { useTranslation } from "react-i18next";

import { Icons } from "@/components/icons/icons";
import { useAuthStore } from "@/stores/auth.store";

export function ProfileDropdown() {
  const { user } = useAuthStore();
  const profileImage = user?.image;
  const isProMember = user?.isPro;
  const { t } = useTranslation();

  return (
    <SidebarMenuButton size="lg" asChild>
      {user ? (
        <a className="cursor-pointer">
          <div className="relative flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            {profileImage ? (
              <img
                className="size-8 rounded-lg"
                src={profileImage}
                alt={t("profile.image.alt")}
                width={32}
                height={32}
              />
            ) : (
              <Icons.user className="size-4" />
            )}
            {!isProMember && (
              <Icons.proMember className="absolute -right-1.5 -top-1.5 h-4 w-4 text-background" />
            )}
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="truncate font-semibold">{user?.email}</span>
            <span className="opacity-50">v{VERSION}</span>
          </div>
        </a>
      ) : (
        <a className="cursor-pointer">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Icons.user className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">Guest</span>
            <span className="opacity-50">v{VERSION}</span>
          </div>
        </a>
      )}
    </SidebarMenuButton>
  );
}
