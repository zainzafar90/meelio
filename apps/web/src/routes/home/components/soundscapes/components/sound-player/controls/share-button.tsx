import { toast } from "sonner";

import { SoundState } from "@/types/sound";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSoundscapesStore } from "@/stores/soundscapes.store";
import { copyToClipboard } from "@/utils/common.utils";
import { encodeSoundState } from "@/utils/router.utils";

export const ShareButton = () => {
  const { sounds } = useSoundscapesStore((state) => state);

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
            "group flex items-center justify-center w-8 h-8 p-1 relative rounded-md bg-background/90 text-foreground/70 focus:outline-none focus:ring-1 focus:ring-muted-background focus:ring-offset-1"
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
