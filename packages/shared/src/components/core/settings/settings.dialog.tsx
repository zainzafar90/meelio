import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/ui/sidebar";
import { CreditCard, Home, Paintbrush, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ProfileDropdown } from "./components/user-profile/profile-dropdown";
import { AccountSettings } from "./tabs/account-settings";
import { AppearanceSettings } from "./tabs/appearance-settings";
import { BillingSettings } from "./tabs/billing-settings";
import { GeneralSettings } from "./tabs/general-settings";
import { api } from "../../../api";
import { Icons } from "../../../components/icons";
import { cn } from "../../../lib";
import { SettingsTab, useSettingsStore, useAuthStore } from "../../../stores";

type SettingsNavItem = {
  id: SettingsTab;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SETTINGS_NAV: SettingsNavItem[] = [
  { id: "general", name: "general", icon: Home },
  { id: "appearance", name: "appearance", icon: Paintbrush },
  { id: "account", name: "account", icon: User },
  { id: "billing", name: "billing", icon: CreditCard },
] as const;

export function SettingsDialog() {
  const { t } = useTranslation();
  const { isOpen, closeSettings, currentTab, setTab } = useSettingsStore();
  const { user, logout } = useAuthStore((state) => state);

  const signOut = async () => {
    logout();
    closeSettings();
    await api.auth.logoutAccount();
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "general":
        return <GeneralSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "account":
        return <AccountSettings />;
      case "billing":
        return <BillingSettings />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="flex h-[90vh] max-h-[900px] overflow-hidden bg-background/80 p-0 backdrop-blur-3xl md:max-w-[700px] lg:max-w-[800px] ">
        <DialogTitle className="sr-only">
          {t("settings.dialog.title")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t("settings.dialog.description")}
        </DialogDescription>
        <SidebarProvider className="flex h-full w-full items-start">
          <Sidebar collapsible="icon" className="hidden md:flex">
            {/* User Profile */}
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <ProfileDropdown />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            {/* Sidebar Navigation Items */}
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {SETTINGS_NAV.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setTab(item.id)}
                          className={cn(currentTab === item.id && "bg-muted")}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{t(`settings.nav.${item.name}`)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    {user && (
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => void signOut()}>
                          <Icons.logout className="h-4 w-4" />
                          <span>Logout</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-full w-full flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="rounded-sm p-2 hover:bg-sidebar-primary/10">
                  <Icons.panelleft className="size-4" />
                </SidebarTrigger>
                <span>{t(`settings.nav.${currentTab}`)}</span>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 pb-32">
              {renderTabContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
