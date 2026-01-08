import { SidebarMenuButton } from "@repo/ui/components/ui/sidebar";
import { useTranslation } from "react-i18next";

import { Icons } from "../../../../../components/icons/icons";
import { useAuthStore } from "../../../../../stores/auth.store";
import { useAppStore } from "../../../../../stores/app.store";
import { useShallow } from "zustand/shallow";

export function ProfileDropdown() {
  const { t } = useTranslation();

  const appVersion = useAppStore(useShallow((state) => state.version));
  const user = useAuthStore(useShallow((state) => state.user));
  const guestUser = useAuthStore(useShallow((state) => state.guestUser));
  const profileImage = user?.avatarUrl;

  const currentUser = user || guestUser;
  const userName = currentUser?.name || "User";

  return (
    <SidebarMenuButton size="lg" asChild>
      {currentUser ? (
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
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="truncate font-semibold">{userName}</span>
            <span className="opacity-50">v{appVersion}</span>
          </div>
        </a>
      ) : (
        <a className="cursor-pointer">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icons.user className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">Guest</span>
            <span className="opacity-50">v{appVersion}</span>
          </div>
        </a>
      )}
    </SidebarMenuButton>
  );
}
