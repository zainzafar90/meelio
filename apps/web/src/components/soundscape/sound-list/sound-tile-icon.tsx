import { memo } from "react";

import { useMeelioStore } from "@/stores/meelio.store";
import { Switch } from "@headlessui/react";

import { Sound } from "@/types/sound";
import { Telemetry } from "@/lib/telemetry/telemetry";
import { cn } from "@/lib/utils";
import { RipplesEffect } from "@/components/ripple-effects";
import { Spinner } from "@/components/ui/spinner";
import { VolumeSlider } from "@/components/ui/volume-slider";

type Props = {
  sound: Sound;
};

export const SoundTileIcon: React.FC<Props> = memo(({ sound }) => {
  const { setVolumeForSound, toggleSoundState } = useMeelioStore(
    (state) => state
  );

  return (
    <div className="relative flex w-full flex-col items-center p-2">
      <Switch
        checked={sound.playing}
        onChange={() => {
          if (typeof window === "undefined") return;
          if (sound.playing) {
            Telemetry.instance.soundStopped(sound);
          } else {
            Telemetry.instance.soundPlayed(sound);
          }
          toggleSoundState(sound.id);
        }}
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
      </Switch>

      <div
        className={cn("w-full py-4 mt-4 px-8 transition-all duration-200", {
          "opacity-0 invisible": !sound.playing,
          "opacity-100 visible": sound.playing,
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
});

SoundTileIcon.displayName = "SoundTileIcon";
