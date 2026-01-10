import { Spinner } from "@repo/ui/components/ui/spinner";
import { VolumeSlider } from "@repo/ui/components/ui/volume-slider";

import { Sound } from "../../../../../types";

import { cn } from "../../../../../lib";
import { RipplesEffect } from "../../../../../components";
import { useSoundscapesStore } from "../../../../../stores/soundscapes.store";
import { useShallow } from "zustand/shallow";

type Props = {
  sound: Sound;
};

export const SoundTileIcon: React.FC<Props> = ({ sound }) => {
  const { setVolumeForSound, toggleSoundState } = useSoundscapesStore(
    useShallow((state) => ({
      setVolumeForSound: state.setVolumeForSound,
      toggleSoundState: state.toggleSoundState,
    }))
  );

  const handleToggle = () => {
    toggleSoundState(sound.id);
  };

  return (
    <div className="relative flex w-full flex-col items-center p-2">
      <button
        type="button"
        aria-pressed={sound.playing}
        onClick={handleToggle}
        className="relative"
      >
        <div className="group flex w-full flex-col items-center p-2">
          <div
            className={cn(
              "relative z-10 flex h-16 w-16 items-center justify-center rounded-full",
              sound.playing ? "grayscale-0" : "grayscale"
            )}
          >
            <sound.icon className="h-13 w-13" />
            {sound.playing ? <RipplesEffect size="sm" /> : null}
          </div>
          <h2
            className={cn(
              "mt-2 flex items-center text-[10px] font-bold uppercase",
              sound.playing
                ? "text-foreground"
                : "text-foreground/80 group-hover:text-foreground"
            )}
          >
            <span className="cursor-pointer">
              <span className="relative z-10">{sound.name}</span>
            </span>
          </h2>
        </div>

        <div className="mt-2 flex scale-75 items-center justify-center gap-x-2">
          {sound.loading && <Spinner />}
        </div>
      </button>

      <div
        className={cn("mt-4 w-full px-8 py-4 transition-all duration-200", {
          "invisible opacity-0": !sound.playing,
          "visible opacity-100": sound.playing,
        })}
      >
        <VolumeSlider
          min={0}
          max={1}
          step={0.01}
          value={[sound.volume]}
          id={`${sound.id}-volume`}
          aria-label={`${sound.name} volume`}
          onValueChange={(v) => {
            setVolumeForSound(sound.id, v[0] || 0);
          }}
        />
      </div>
    </div>
  );
};

SoundTileIcon.displayName = "SoundTileIcon";
