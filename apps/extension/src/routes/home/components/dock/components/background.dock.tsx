import { cn } from "@repo/ui/lib/utils";

import { Icons } from "@/components/icons/icons";
import { useDockStore } from "@/stores/dock.store";

export const BackgroundDock = () => {
  const { toggleBackgrounds } = useDockStore();

  return (
    <button
      onClick={toggleBackgrounds}
      className={cn(
        "flex size-10 items-center justify-center rounded-xl shadow-lg",
        "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900"
      )}
      title="Change Background"
    >
      <Icons.background className="size-6 text-white" />
    </button>
  );
};
