import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import gsap from "gsap";

import { cn } from "../../../../../../lib";
import { Icons } from "../../../../../../components/icons";
import { useInterval } from "../../../../../../hooks/use-interval";
import { useSoundscapesStore } from "../../../../../../stores/soundscapes.store";
import { PremiumFeature } from "../../../../../../components/common/premium-feature";
import { PremiumFeatureTooltip } from "../../../../../../components/common/premium-feature-tooltip";
import { useAuthStore } from "../../../../../../stores/auth.store";
import {
  generateNextVolumeForOscillation,
  OSCILLATION_INTERVAL_MS,
} from "../../../../../../utils/sound.utils";

export const OscillationButton = () => {
  const { sounds, isOscillating, toggleOscillation, setVolumeForSound } =
    useSoundscapesStore();
  const { user } = useAuthStore();

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
  );

  return (
    <div className="relative">
      {!user?.isPro && (
        <div className="absolute -top-2 -right-2 z-10">
          <PremiumFeatureTooltip
            featureName="Sound Oscillation"
            description="Natural volume variations"
            benefits={[
              "More immersive experience",
              "Prevents sound monotony",
              "Creates organic soundscapes",
            ]}
          />
        </div>
      )}

      <PremiumFeature
        requirePro={true}
        fallback={
          <button
            type="button"
            className="focus:ring-muted-background group relative flex size-9 items-center justify-center rounded-md text-foreground/30 opacity-60 cursor-not-allowed"
            disabled
            aria-label="Premium Feature: Oscillation"
          >
            <div className="absolute -inset-4 md:hidden" />
            <Icons.oscillation className="size-6" />
          </button>
        }
      >
        {oscillationButtonContent}
      </PremiumFeature>
    </div>
  );
};
