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
import {
  CreditCard,
  Home,
  Paintbrush,
  User,
  Languages,
  Anchor,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { ProfileDropdown } from "./components/user-profile/profile-dropdown";
import { AccountSettings } from "./tabs/account-settings";
import { AppearanceSettings } from "./tabs/appearance-settings";
import { BillingSettings } from "./tabs/billing-settings";
import { GeneralSettings } from "./tabs/general-settings";
import { LanguageSettings } from "./tabs/language-settings";
import { DockSettings } from "./tabs/dock-settings";
import { api } from "../../../api";
import { Icons } from "../../../components/icons";
import { cn } from "../../../lib";
import { SettingsTab, useSettingsStore } from "../../../stores/settings.store";
import { useAuthStore } from "../../../stores/auth.store";
import { useShallow } from "zustand/shallow";
import { LogoMonochrome } from "../../../components/common/logo";
import { LoginButton } from "./components/common/login-protected";
import { FeedbackSettings } from "./tabs/feedback-settings";

type SettingsNavItem = {
  id: SettingsTab;
  name: string;
  requiresLogin?: boolean;
  icon: React.ComponentType<{ className?: string }>;
};

const SETTINGS_NAV: SettingsNavItem[] = [
  { id: "general", name: "general", icon: Home },
  { id: "appearance", name: "appearance", icon: Paintbrush },
  { id: "language", name: "language", icon: Languages },
  { id: "dock", name: "dock", icon: Anchor },
  { id: "feedback", name: "feedback", icon: MessageCircle },
  { id: "account", name: "account", icon: User, requiresLogin: true },
  { id: "billing", name: "billing", icon: CreditCard, requiresLogin: true },
] as const;

export function SettingsDialog() {
  const { t } = useTranslation();
  const { isOpen, closeSettings, currentTab, setTab } = useSettingsStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      closeSettings: state.closeSettings,
      currentTab: state.currentTab,
      setTab: state.setTab,
    }))
  );
  const { user, guestUser, logout } = useAuthStore(
    useShallow((state) => state)
  );

  const signOut = async () => {
    logout();
    closeSettings();
    await api.auth.logoutAccount();
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "general":
        return <GeneralSettings onClose={closeSettings} />;
      case "appearance":
        return <AppearanceSettings />;
      case "language":
        return <LanguageSettings />;
      case "dock":
        return <DockSettings />;
      case "account":
        return <AccountSettings />;
      case "billing":
        return <BillingSettings />;
      case "feedback":
        return <FeedbackSettings />;
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
              {!user && guestUser && (
                <SidebarGroup>
                  <LoginButton className="w-full">
                    <div className="relative">
                      <div
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 rounded-md",
                          "bg-gradient-to-r from-blue-500 to-sky-500",
                          "text-white font-medium shadow-sm transition-colors backdrop-blur-sm"
                        )}
                      >
                        <div className="flex flex-col w-full text-left text-sm">
                          Login
                          <small className="opacity-80 text-xs">
                            to save and sync your data
                          </small>
                        </div>
                        <LogoMonochrome className="h-6 w-6 text-white" />
                      </div>
                      <span className="absolute -top-1 -left-1 h-3 w-3 isolate">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 -top-1 right-0 bg-blue-500"></span>
                      </span>
                    </div>
                  </LoginButton>
                </SidebarGroup>
              )}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {SETTINGS_NAV.filter(
                      (item) => !item.requiresLogin || user
                    ).map((item) => (
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
