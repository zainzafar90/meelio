import { api } from "@/api";
import Avatar from "boring-avatars";

import { AuthUser } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { useAuthStore } from "@/store/auth.store";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Props {
  mobileView?: boolean;
}

export function UserProfileDropdown(props: Props) {
  const { logout } = useAuthStore();
  const user = useAuthStore((state) => state.user) || ({} as AuthUser);
  const profileImage = user.image;
  const email = user.email;
  const isProMember = user.isPro;

  const signOut = async () => {
    logout();
    await api.auth.logoutAccount();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
              <span aria-hidden="true" className="truncate">
                {email}
              </span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void signOut()}>
          <Icons.logout className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
