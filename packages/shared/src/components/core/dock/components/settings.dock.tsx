import { cn } from "@repo/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

import { Icons } from "../../../../components/icons/icons";
import { useSettingsStore } from "../../../../stores/settings.store";
import { SettingsDialog } from "../../settings/settings.dialog";

export const SettingsDock = () => {
  const { openSettings } = useSettingsStore();

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={openSettings}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl shadow-lg",
                "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900"
              )}
            >
              <Icons.settings className="size-6 text-white" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SettingsDialog />
    </>
  );
};
