import { cn } from "../../../../../../lib";
import { Icons } from "../../../../../../components/icons";
import { useSoundscapesStore } from "../../../../../../stores/soundscapes.store";
import { useShallow } from "zustand/shallow";

interface Props {
  isPlayButtonActive?: boolean;
}

export const PlayButton = (props: Props) => {
  const { pausePlayingSounds, resumePausedSounds } = useSoundscapesStore(
    useShallow((state) => ({
      pausePlayingSounds: state.pausePlayingSounds,
      resumePausedSounds: state.resumePausedSounds,
    }))
  );

  const isAnySoundPlaying = useSoundscapesStore((state) =>
    state.sounds.some((sound) => sound.playing)
  );

  const toggleAllSounds = () => {
    if (isAnySoundPlaying) {
      pausePlayingSounds();
    } else {
      resumePausedSounds();
    }
  };

  const Icon = isAnySoundPlaying ? Icons.pause : Icons.play;

  return (
    <button
      role="button"
      onClick={() => toggleAllSounds()}
      aria-label={isAnySoundPlaying ? "Paused" : "Playing"}
      disabled={!props.isPlayButtonActive}
      className={cn(
        "group relative flex cursor-pointer items-center justify-center",
        {
          "hover:bg-initial cursor-not-allowed opacity-50":
            !props.isPlayButtonActive,
        }
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-xl bg-zinc-900",
          "shadow-sm shadow-zinc-950/50"
        )}
        title={isAnySoundPlaying ? "Paused" : "Playing"}
      >
        <Icon className="size-4 text-white" />
      </div>
    </button>
  );
};
