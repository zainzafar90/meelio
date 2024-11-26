import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { SettingsDialog } from "@/components/settings.dialog";
import { useSettingsStore } from "@/stores/settings.store";

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
