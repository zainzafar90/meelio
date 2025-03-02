import gsap from "gsap";

import { Sound } from "../../../../../../types";
import { cn } from "../../../../../../lib";
import { Icons } from "../../../../../../components/icons";
import { useInterval } from "../../../../../../hooks/use-interval";
import { useSoundscapesStore } from "../../../../../../stores/soundscapes.store";
import { PremiumFeature } from "../../../../../../components/common/premium-feature";
import {
  generateNextVolumeForShuffle,
  SHUFFLE_SOUNDS_INTERVAL_MS,
} from "../../../../../../utils/sound.utils";

export const ShuffleButton = () => {
  const {
    sounds,
    setVolumeForSound,
    playSound,
    pauseSound,
    isShuffling,
    toggleShuffle,
  } = useSoundscapesStore((state) => state);

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

  const shuffleButtonContent = (
    <button
      type="button"
      className={cn(
        "bg-muted-background focus:ring-muted-background group relative flex size-9 items-center justify-center rounded-md text-foreground/50 hover:bg-background/60 focus:outline-none focus:ring-2 focus:ring-offset-1",
        {
          "bg-background/50 text-foreground": isShuffling,
        }
      )}
      onClick={() => toggleShuffle()}
      aria-label={isShuffling ? "Shuffle Enabled" : "Shuffle Disabled"}
    >
      <div className="absolute -inset-4 md:hidden" />
      <Icons.shuffle className="size-6" />
    </button>
  );

  return (
    <div className="relative">
      <PremiumFeature
        requirePro={true}
        fallback={
          <button
            type="button"
            className="focus:ring-muted-background group relative flex size-9 items-center justify-center rounded-md text-foreground/30 opacity-60 "
            aria-label="Premium Feature: Shuffle"
          >
            <div className="absolute -inset-4 md:hidden" />
            <Icons.shuffle className="size-6" />
          </button>
        }
      >
        {shuffleButtonContent}
      </PremiumFeature>
    </div>
  );
};
