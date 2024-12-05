import { cn } from "@repo/ui/lib/utils";

import { Icons } from "@/components/icons/icons";
import { useSettingsStore } from "@/stores/settings.store";

import { SettingsDialog } from "../../settings/settings.dialog";

export const SettingsDock = () => {
  const { openSettings } = useSettingsStore();

  return (
    <>
      <button
        onClick={openSettings}
        title="Settings"
        className={cn(
          "flex size-10 items-center justify-center rounded-xl shadow-lg",
          "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900"
        )}
      >
        <Icons.settings className="size-6 text-white" />
      </button>
      <SettingsDialog />
    </>
  );
};
