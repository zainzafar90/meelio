import { Link } from "react-router-dom";

import { VERSION } from "@/version";
import Avatar from "boring-avatars";
import {
  BadgeCheck,
  BarChart2,
  CheckSquare,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Focus,
  Heart,
  Info,
  LifeBuoy,
  LogOut,
  Paintbrush,
  PieChart,
  Settings,
  Sparkles,
  Target,
  User,
} from "lucide-react";

import { AuthUser } from "@/types/auth";
import { Icons } from "@/components/icons/icons";
import { Logo } from "@/components/logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth.store";

const data = {
  essentials: [
    {
      title: "Dashboard",
      url: "#",
      icon: PieChart,
      isActive: true,
    },
    {
      title: "Focus Mode",
      url: "#",
      icon: Focus,
      isActive: false,
    },
  ],
  productivity: [
    {
      title: "Focus Tools",
      url: "#",
      icon: Target,
      isActive: false,
      items: [
        {
          title: "Pomodoro Timer",
          url: "#",
        },
        {
          title: "White Noise",
          url: "#",
        },
        {
          title: "Text Editor",
          url: "#",
        },
      ],
    },
    {
      title: "Tasks & Goals",
      url: "#",
      icon: CheckSquare,
      items: [
        {
          title: "To-do List",
          url: "#",
        },
        {
          title: "Habits Tracker",
          url: "#",
        },
      ],
    },
  ],
  wellbeing: [
    {
      title: "Wellness",
      url: "#",
      icon: Heart,
      isActive: false,
      items: [
        {
          title: "Breathing Exercises",
          url: "#",
        },
        {
          title: "Meditation",
          url: "#",
        },
        {
          title: "Quotes",
          url: "#",
        },
        {
          title: "Mantras",
          url: "#",
        },
      ],
    },
  ],
  personalization: [
    {
      title: "Customization",
      url: "#",
      icon: Paintbrush,
      isActive: false,
      items: [
        {
          title: "Themes",
          url: "#",
        },
        {
          title: "Widgets",
          url: "#",
        },
        {
          title: "Notifications",
          url: "#",
        },
      ],
    },
    {
      title: "Statistics",
      url: "#",
      icon: BarChart2,
      isActive: false,
    },
  ],
  system: [
    {
      title: "Account",
      url: "#",
      icon: User,
      isActive: false,
    },
    {
      title: "Preferences",
      url: "#",
      icon: Settings,
      isActive: false,
    },
  ],
  navSecondary: [
    {
      title: "Help",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "About",
      url: "#",
      icon: Info,
    },
  ],
};

export const AppSidebar = () => {
  const user = useAuthStore((state) => state.user) || ({} as AuthUser);
  const profileImage = user.image || "";
  const email = user.email || "";
  const name = user.name || "Guest";
  const isProMember = user.isPro || false;

  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-background text-sidebar-primary-foreground">
                  <Logo className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-lg leading-tight">
                  <span className="truncate font-medium">Meelio</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.essentials.map((item) => (
              <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Productivity</SidebarGroupLabel>
          <SidebarMenu>
            {data.productivity.map((item) => (
              <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction className="data-[state=open]:rotate-90">
                          <ChevronRight />
                          <span className="sr-only">Toggle</span>
                        </SidebarMenuAction>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Wellbeing</SidebarGroupLabel>
          <SidebarMenu>
            {data.wellbeing.map((item) => (
              <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction className="data-[state=open]:rotate-90">
                          <ChevronRight />
                          <span className="sr-only">Toggle</span>
                        </SidebarMenuAction>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu>
            {/* Only show account-related items if user is logged in */}
            {user.email && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/account/settings">Settings</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/account/billing">Billing</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
            {/* Show login/register if user is not logged in */}
            {!user.email && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/login">Login</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/register">Register</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm">
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
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
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {email || name}
                    </span>
                    <div className="font-light text-xs text-muted-foreground">
                      Meelio: v{VERSION}
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
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
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {email || name}
                      </span>
                      <div className="font-light text-xs text-muted-foreground">
                        Meelio: v{VERSION}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="gap-2">
                    <Sparkles className="size-4" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="gap-2">
                    <BadgeCheck className="size-4" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <CreditCard className="size-4" />
                    Billing
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
