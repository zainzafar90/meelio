import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const SettingsDock = () => {
  return (
    <SidebarTrigger
      title="Toggle Sidebar"
      className={cn(
        "flex size-10 items-center justify-center rounded-xl shadow-lg",
        "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900"
      )}
    >
      <Icons.settings className="size-6 text-white" />
    </SidebarTrigger>
  );
};
