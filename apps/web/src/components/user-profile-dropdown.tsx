import { VERSION } from "@/version";
import Avatar from "boring-avatars";
import { useTranslation } from "react-i18next";

import { AuthUser } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { useAuthStore } from "@/stores/auth.store";

interface Props {
  mobileView?: boolean;
}

export function UserProfileDropdown(props: Props) {
  const user = useAuthStore((state) => state.user) || ({} as AuthUser);
  const profileImage = user.image;
  const email = user.email;
  const isProMember = user.isPro;
  const { t } = useTranslation();

  return (
    <button
      title={email || ""}
      className={cn(
        "items-center text-sm font-semibold leading-6 text-foreground hover:bg-muted-foreground/10",
        {
          "hidden w-full gap-x-4 px-6 py-3 lg:flex": !props.mobileView,
          "flex lg:hidden": props.mobileView,
        }
      )}
    >
      <div className="relative h-8 w-8 flex-shrink-0 rounded-full">
        {isProMember && (
          <Icons.proMember className="absolute -right-1.5 -top-1.5 h-4 w-4 text-background" />
        )}
        {profileImage ? (
          <img
            className="h-8 w-8 rounded-full bg-black"
            src={profileImage}
            alt={t("profile.image.alt")}
            width={32}
            height={32}
          />
        ) : (
          <Avatar
            size={32}
            name={email}
            colors={["#FFCC00", "#FF005B", "#FF7D10"]}
          />
        )}
      </div>

      {!props.mobileView && (
        <>
          <span className="sr-only">{t("profile.your-profile")}</span>
          <div className="flex w-full flex-col truncate text-left">
            <div aria-hidden="true">{email}</div>

            <div className="text-xs font-light text-muted-foreground">
              {t("profile.meelio-version")} v{VERSION}
            </div>
          </div>
        </>
      )}
    </button>
  );
}
