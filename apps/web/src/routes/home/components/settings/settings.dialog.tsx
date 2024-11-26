import { CreditCard, Home, Paintbrush, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { SettingsTab, useSettingsStore } from "@/stores/settings.store";

import { Icons } from "../../../../components/icons/icons";
import { AccountSettings } from "./tabs/account-settings";
import { AppearanceSettings } from "./tabs/appearance-settings";
import { BillingSettings } from "./tabs/billing-settings";
import { GeneralSettings } from "./tabs/general-settings";

const SETTINGS_NAV: {
  id: SettingsTab;
  name: string;
  icon: React.ElementType;
}[] = [
  { id: "general", name: "general", icon: Home },
  { id: "appearance", name: "appearance", icon: Paintbrush },
  { id: "account", name: "account", icon: User },
  { id: "billing", name: "billing", icon: CreditCard },
] as const;

export function SettingsDialog() {
  const { t } = useTranslation();
  const { isOpen, closeSettings, currentTab, setTab } = useSettingsStore();

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
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">
          {t("settings.dialog.title")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t("settings.dialog.description")}
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
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
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-4">
                <Icons.home className="h-4 w-4" />
                <span>{t(`settings.nav.${currentTab}`)}</span>
              </div>
            </header>
            <div className="flex flex-1 flex-col overflow-y-auto p-6">
              {renderTabContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
