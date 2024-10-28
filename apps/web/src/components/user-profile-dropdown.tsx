import { VERSION } from "@/version";
import Avatar from "boring-avatars";

import { AuthUser } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { useAuthStore } from "@/stores/auth.store";

import { SettingsDialog } from "./settings.dialog";

interface Props {
  mobileView?: boolean;
}

export function UserProfileDropdown(props: Props) {
  const user = useAuthStore((state) => state.user) || ({} as AuthUser);
  const profileImage = user.image;
  const email = user.email;
  const isProMember = user.isPro;

  return (
    <SettingsDialog>
      <button
        title={email || ""}
        className={cn(
          "items-center text-sm font-semibold leading-6 text-foreground hover:bg-muted-foreground/10",
          {
            "hidden w-full lg:flex gap-x-4 px-6 py-3": !props.mobileView,
            "flex lg:hidden": props.mobileView,
          }
        )}
      >
        <div className="relative h-8 w-8 rounded-full flex-shrink-0">
          {isProMember && (
            <Icons.proMember className="w-4 h-4 absolute -top-1.5 -right-1.5 text-background" />
          )}
          {profileImage ? (
            <img
              className="h-8 w-8 rounded-full bg-black"
              src={profileImage}
              alt="Profile"
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
            <span className="sr-only">Your profile</span>
            <div className="flex flex-col w-full text-left truncate">
              <div aria-hidden="true">{email}</div>

              <div className="font-light text-xs text-muted-foreground">
                Meelio Version: v{VERSION}
              </div>
            </div>
          </>
        )}
      </button>
    </SettingsDialog>
  );
}
