import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { useMeelioStore } from "@/store/meelio.store";

import { GlobalVolumeControl } from "./global-volume-control";
import { OscillationButton } from "./oscillation-button";
import { PlayButton } from "./play-button";
import { ResetGlobalSoundSettingsDialog } from "./reset-global-sound-settings.dialog";
// import { SaveComboButton } from "./save-combo-button";
// import { ShareButton } from "./share-button";
import { ShuffleButton } from "./shuffle-button";

export const SoundControlsBar = () => {
  const { pausedSounds } = useMeelioStore();

  const isAnySoundPlaying = useMeelioStore((state) =>
    state.sounds.some((sound) => sound.playing)
  );

  const isBarVisible = useMemo(() => {
    return pausedSounds.length > 0 || isAnySoundPlaying;
  }, [pausedSounds, isAnySoundPlaying]);

  return (
    <div
      className={cn("fixed inset-x-0 bottom-0 z-[-1] lg:left-72 xl:left-120", {
        "z-10": isBarVisible,
      })}
    >
      <div
        className={cn(
          "relative translate-y-[80px] flex items-center justify-center gap-6 bg-gray-100/90 dark:bg-gray-800/90 px-4 py-4 shadow-sm shadow-foreground/10 ring-1 ring-foreground/5 backdrop-blur-sm transition-all ease-in-out duration-300 transform md:px-6",
          {
            "translate-y-0": isBarVisible,
          }
        )}
      >
        <div className="flex items-center gap-4 w-full">
          <div className="flex flex-1 flex-shrink-0 items-center gap-4">
            {/* <SaveComboButton />
          <ShareButton /> */}
            <span className="block md:hidden">
              <ResetGlobalSoundSettingsDialog />
            </span>
          </div>
          <div className="flex flex-1 flex-shrink-0 items-center justify-center gap-4">
            <ShuffleButton />
            <PlayButton isPlayButtonActive={isBarVisible} />
            <OscillationButton />
          </div>
          <div className="flex flex-1 flex-shrink-0 items-center gap-2 justify-end w-full">
            <GlobalVolumeControl />

            <span className="ml-4 hidden md:block">
              <ResetGlobalSoundSettingsDialog />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
