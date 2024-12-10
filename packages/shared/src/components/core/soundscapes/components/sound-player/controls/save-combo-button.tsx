import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

import { SoundState } from "../../../../../../types";
import { cn } from "../../../../../../lib";
import { Icons } from "../../../../../../components/icons";
import { useSoundscapesStore } from "../../../../../../stores/soundscapes.store";

export const SaveComboButton = () => {
  const { addCombo } = useSoundscapesStore((state) => state);
  const currentlyPlayingSounds = useSoundscapesStore((state) =>
    state.sounds.filter((sound) => sound.playing)
  );

  const saveCurrentSoundsAsCombo = () => {
    // Assuming you have currentSounds as an array of sound objects
    // with each object having an id and volume property.
    const currentSounds: SoundState[] = currentlyPlayingSounds.map((sound) => {
      return {
        id: sound.id,
        volume: sound.volume,
      };
    });

    if (currentSounds.length > 0) {
      addCombo({
        id: Math.floor(Math.random() * 10).toString(),
        name: "New Combo",
        sounds: currentSounds as SoundState[],
      });
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus:ring-muted-background group relative flex h-8 w-8 items-center justify-center rounded-md bg-background/90 p-1 text-foreground/70 focus:outline-none focus:ring-1 focus:ring-offset-1"
          )}
          onClick={saveCurrentSoundsAsCombo}
        >
          <div className="absolute -inset-4 md:hidden" />
          <Icons.save className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Save your favourite sounds</p>
      </TooltipContent>
    </Tooltip>
  );
};
