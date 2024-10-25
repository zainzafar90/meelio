import { useMeelioStore } from "@/stores/meelio.store";
import gsap from "gsap";

import { Sound } from "@/types/sound";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInterval } from "@/hooks/use-interval";
import {
  generateNextVolumeForShuffle,
  SHUFFLE_SOUNDS_INTERVAL_MS,
} from "@/utils/sound.utils";

export const ShuffleButton = () => {
  const {
    sounds,
    setVolumeForSound,
    playSound,
    pauseSound,
    isShuffling,
    toggleShuffle,
  } = useMeelioStore((state) => state);

  useInterval(() => {
    if (!isShuffling) return;
    const playingSounds = sounds.filter((sound) => sound.playing);

    const soundsToPlay: Sound[] = [];
    while (soundsToPlay.length < 3) {
      const randomSound = sounds[Math.floor(Math.random() * sounds.length)]!;

      if (
        !soundsToPlay.includes(randomSound) &&
        !playingSounds.includes(randomSound)
      ) {
        soundsToPlay.push(randomSound);
      }
    }

    playingSounds.forEach((sound) => {
      gsap.to(sound, {
        volume: 0,
        duration: 5,
        ease: "sine.inOut",
        onUpdate: () => {
          setVolumeForSound(sound.id, sound.volume);
        },
        onComplete: () => {
          pauseSound(sound.id);
        },
      });
    });

    soundsToPlay.forEach((sound) => {
      playSound(sound.id);
      const nextVolume = generateNextVolumeForShuffle();

      gsap.fromTo(
        sound,
        { volume: 0 },
        {
          volume: nextVolume,
          duration: 5,
          ease: "sine.inOut",
          onUpdate: () => {
            setVolumeForSound(sound.id, sound.volume);
          },
        }
      );
    });
  }, SHUFFLE_SOUNDS_INTERVAL_MS);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex items-center justify-center w-10 h-10 relative rounded-md bg-muted-background text-foreground/50 hover:bg-background/60 focus:outline-none focus:ring-2 focus:ring-muted-background focus:ring-offset-1",
            {
              "bg-background/10 text-foreground": isShuffling,
            }
          )}
          onClick={() => toggleShuffle()}
          aria-label={isShuffling ? "Shuffle Enabled" : "Shuffle Disabled"}
        >
          <div className="absolute -inset-4 md:hidden" />
          <Icons.shuffle className="h-8 w-8" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Shuffle between different sounds after certain intervals</p>
      </TooltipContent>
    </Tooltip>
  );
};
