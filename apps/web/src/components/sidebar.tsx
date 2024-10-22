import { Link, useLocation } from "react-router-dom";

import { api } from "@/api";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

import { Icons } from "./icons/icons";
import { Logomark } from "./logo";
import { UserProfileDropdown } from "./user-profile-dropdown";

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="200"
  height="200"
  viewBox="0 0 24 24"
>
  <path
    fill="currentColor"
    d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z"
  />
  <rect width="2" height="7" x="11" y="6" fill="currentColor" rx="1">
    <animateTransform
      attributeName="transform"
      dur="9s"
      repeatCount="indefinite"
      type="rotate"
      values="0 12 12;360 12 12"
    />
  </rect>
  <rect width="2" height="9" x="11" y="11" fill="currentColor" rx="1">
    <animateTransform
      attributeName="transform"
      dur="0.75s"
      repeatCount="indefinite"
      type="rotate"
      values="0 12 12;360 12 12"
    />
  </rect>
</svg>;

const navigation = [
  {
    name: "Soundscapes",
    href: "/soundscapes",
    icon: Icons.soundscapes,
    activeIcon: Icons.soundscapesActive,
  },
  {
    name: "Pomodoro",
    href: "/pomodoro",
    icon: Icons.pomodoro,
    activeIcon: Icons.pomodoroActive,
  },
  {
    name: "Writer",
    href: "/writer",
    icon: Icons.writer,
    activeIcon: Icons.writerActive,
    hidden: true,
  },
  {
    name: "Breathing",
    href: "/breathing",
    icon: Icons.breathing,
    activeIcon: Icons.breathingActive,
  },
];

const accountNavigation = [
  {
    name: "Billing",
    href: "/account/billing",
    icon: Icons.billing,
    activeIcon: Icons.billingActive,
  },
  {
    name: "Settings",
    href: "/account/settings",
    icon: Icons.settings,
    activeIcon: Icons.settingsActive,
  },
];

export const SidebarOld = () => {
  const router = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const isCurrentView = (href: string) => router.pathname === href;

  const signOut = async () => {
    logout();
    await api.auth.logoutAccount();
  };

  return (
    <div className="flex grow flex-col gap-y-5 px-6 overflow-y-auto bg-background border border-r-[#00000014] dark:border-r-[#ffffff14]">
      {/* Sidebar component, swap this element with another sidebar if you like */}

      <div className="flex h-16 shrink-0 items-center">
        <Link to="/">
          <Logomark className="h-8 w-auto" />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation
                .filter((n) => !n.hidden)
                .map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        isCurrentView(item.href)
                          ? "bg-foreground/10 text-foreground/90"
                          : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground/90",
                        "group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium"
                      )}
                    >
                      {isCurrentView(item.href) ? (
                        <item.activeIcon
                          className="size-5 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <item.icon
                          className="size-5 hrink-0"
                          aria-hidden="true"
                        />
                      )}
                      {item.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </li>

          <li className="-mx-6 mt-auto">
            <ul role="list" className="px-6 -mx-2 space-y-1 mb-2">
              {accountNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      isCurrentView(item.href)
                        ? "bg-foreground/10 text-foreground/90"
                        : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground/90",
                      "group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium"
                    )}
                  >
                    {isCurrentView(item.href) ? (
                      <item.activeIcon
                        className="size-5 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <item.icon
                        className="size-5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {item.name}
                  </Link>
                </li>
              ))}

              <li>
                <button
                  onClick={() => void signOut()}
                  className={cn(
                    "w-full",
                    "text-foreground/70 hover:bg-foreground/10 hover:text-foreground/90",
                    "group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium"
                  )}
                >
                  <Icons.logout className="mr-2 size-5" />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
            <div
              data-orientation="horizontal"
              role="none"
              className="shrink-0 bg-border h-[1px] w-full"
            />
            <UserProfileDropdown />
          </li>
        </ul>
      </nav>
    </div>
  );
};
