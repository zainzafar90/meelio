import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";

import { SoundState } from "../../../../../../types";
import { cn } from "../../../../../../lib";
import { Icons } from "../../../../../../components/icons";
import { useSoundscapesStore } from "../../../../../../stores/soundscapes.store";
import { copyToClipboard } from "../../../../../../utils/common.utils";
import { encodeSoundState } from "../../../../../../utils/router.utils";
import { useShallow } from "zustand/shallow";

export const ShareButton = () => {
  const { sounds } = useSoundscapesStore(useShallow((state) => state));

  // Encode the sound state and generate the shareable link
  const generateShareableLink = () => {
    const soundState: SoundState[] = sounds
      .filter((s) => s.playing)
      .map((sound) => ({
        id: sound.id,
        volume: sound.volume,
      }));
    const encodedState = encodeSoundState(soundState);
    const shareableLink = `${window.location.origin}/share?state=${encodedState}`;

    copyToClipboard(shareableLink);

    toast("Copied to clipboard!", {
      description: "Share the link with your friends!",
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus:ring-muted-background group relative flex h-8 w-8 items-center justify-center rounded-md bg-background/90 p-1 text-foreground/70 focus:outline-none focus:ring-1 focus:ring-offset-1"
          )}
          onClick={generateShareableLink}
        >
          <div className="absolute -inset-4 md:hidden" />
          <Icons.share className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Share with friends</p>
      </TooltipContent>
    </Tooltip>
  );
};
