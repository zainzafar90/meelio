import gsap from "gsap";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

import { cn } from "../../../../../../lib";
import { Icons } from "../../../../../../components/icons";
import { useInterval } from "../../../../../../hooks/use-interval";
import { useSoundscapesStore } from "../../../../../../stores/soundscapes.store";
import {
  generateNextVolumeForOscillation,
  OSCILLATION_INTERVAL_MS,
} from "../../../../../../utils/sound.utils";
import { useShallow } from "zustand/shallow";

export const OscillationButton = () => {
  const { isOscillating, toggleOscillation } = useSoundscapesStore(
    useShallow((state) => ({
      isOscillating: state.isOscillating,
      toggleOscillation: state.toggleOscillation,
    }))
  );

  const { sounds, setVolumeForSound } = useSoundscapesStore();

  useInterval(() => {
    if (!isOscillating) return;

    // Get all playing sounds
    const playingSounds = sounds.filter((sound) => sound.playing);

    // Pick a random sound from the playing sounds
    const soundToOscillate =
      playingSounds[Math.floor(Math.random() * playingSounds.length)];

    if (soundToOscillate) {
      const nextVolume = generateNextVolumeForOscillation(soundToOscillate);

      gsap.to(soundToOscillate, {
        volume: nextVolume,
        duration: 5,
        ease: "sine.inOut",
        onUpdate: () => {
          // update the sound's volume in your app state on each animation frame
          setVolumeForSound(soundToOscillate.id, soundToOscillate.volume);
        },
      });
    }
  }, OSCILLATION_INTERVAL_MS);

  const oscillationButtonContent = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus:ring-muted-background group relative flex size-9 items-center justify-center rounded-md text-foreground/50 hover:bg-background/60 focus:outline-none focus:ring-2 focus:ring-offset-1",
            {
              "bg-background/50 text-foreground": isOscillating,
            }
          )}
          onClick={() => toggleOscillation()}
          aria-label={
            isOscillating ? "Oscillation Enabled" : "Oscillation Disabled"
          }
        >
          <div className="absolute -inset-4 md:hidden" />
          <Icons.oscillation className="size-6" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{isOscillating ? "Disable oscillation" : "Enable oscillation"}</p>
      </TooltipContent>
    </Tooltip>
  );

  return <div className="relative">{oscillationButtonContent}</div>;
};
