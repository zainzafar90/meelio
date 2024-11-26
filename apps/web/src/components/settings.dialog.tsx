import { CreditCard, Home, Paintbrush, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
// import { useAuthStore } from "@/stores/auth.store";
import { SettingsTab, useSettingsStore } from "@/stores/settings.store";

import { Icons } from "./icons/icons";
import { AppearanceSettings } from "./settings/tabs/appearance-settings";

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
  // const user = useAuthStore((state) => state.user);

  console.log(currentTab, isOpen);
  const renderTabContent = () => {
    switch (currentTab) {
      case "appearance":
        return <AppearanceSettings />;
      case "general":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {t("settings.tabs.generalDescription")}
            </p>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {t("settings.tabs.comingSoon")}
            </p>
          </div>
        );
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
                          onClick={() => setTab(item.id as any)}
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
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                        <Icons.home className="h-4 w-4" />
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {t(`settings.nav.${currentTab}`)}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
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
