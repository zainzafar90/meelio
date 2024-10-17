import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

import { Icons } from "./icons/icons";
import { Logomark } from "./logo";
import { UserProfileDropdown } from "./user-profile-dropdown";

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
];

const accountNavigation = [
  {
    name: "Billing",
    href: "/account/billing",
    icon: Icons.billing,
    activeIcon: Icons.billing,
  },
  {
    name: "Settings",
    href: "/account/settings",
    icon: Icons.settings,
    activeIcon: Icons.settings,
  },
];

export const Sidebar = () => {
  const router = useLocation();

  const isCurrentView = (href: string) => router.pathname === href;

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
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <item.icon
                          className="h-4 w-4 shrink-0"
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
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <item.icon
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {item.name}
                  </Link>
                </li>
              ))}
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
