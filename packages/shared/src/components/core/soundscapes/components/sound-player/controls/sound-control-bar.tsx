import { useMemo } from "react";

import { cn } from "../../../../../../lib";
import { useSoundscapesStore } from "../../../../../../stores/soundscapes.store";

import { GlobalVolumeControl } from "./global-volume-control";
import { OscillationButton } from "./oscillation-button";
import { PlayButton } from "./play-button";
// import { ResetGlobalSoundSettingsDialog } from "./reset-global-sound-settings.dialog";
// import { SaveComboButton } from "./save-combo-button";
// import { ShareButton } from "./share-button";
import { ShuffleButton } from "./shuffle-button";

export const SoundControlsBar = () => {
  const { pausedSounds } = useSoundscapesStore();

  const isAnySoundPlaying = useSoundscapesStore((state) =>
    state.sounds.some((sound) => sound.playing)
  );

  const isBarVisible = useMemo(() => {
    return pausedSounds.length > 0 || isAnySoundPlaying;
  }, [pausedSounds, isAnySoundPlaying]);

  return (
    <div className="relative inset-x-0 bottom-0 rounded-lg">
      <div
        className={cn(
          "relative flex transform items-center justify-center gap-6 rounded-b-lg bg-zinc-100/50 p-3 dark:bg-zinc-900/50",
          {
            "translate-y-0": isBarVisible,
          }
        )}
      >
        <div className="flex w-full items-center gap-4">
          {/* <div className="flex flex-1 flex-shrink-0 items-center gap-4">
             <SaveComboButton />
            <ShareButton /> 
            <span className="block md:hidden">
              <ResetGlobalSoundSettingsDialog />
            </span>
          </div> */}
          <div className="flex flex-1 flex-shrink-0 items-center justify-start gap-4">
            <PlayButton isPlayButtonActive={isBarVisible} />
            <ShuffleButton />
            <OscillationButton />
          </div>
          <div className="flex w-full flex-1 flex-shrink-0 items-center justify-end gap-2">
            <GlobalVolumeControl />

            {/* <span className="ml-4 hidden md:block">
              <ResetGlobalSoundSettingsDialog />
            </span> */}
          </div>
        </div>
      </div>
    </div>
  );
};
