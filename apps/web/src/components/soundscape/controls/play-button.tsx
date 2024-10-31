import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { useSoundscapesStore } from "@/stores/soundscapes.store";

interface Props {
  isPlayButtonActive?: boolean;
}

export const PlayButton = (props: Props) => {
  const { pausePlayingSounds, resumePausedSounds } = useSoundscapesStore();

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
      disabled={!props.isPlayButtonActive}
      onClick={() => toggleAllSounds()}
      aria-label={isAnySoundPlaying ? "Paused" : "Playing"}
      className={cn(
        "group relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 md:h-12 md:w-12 dark:bg-slate-200 dark:hover:bg-slate-100 dark:focus:ring-slate-200",
        {
          "opacity-50 cursor-not-allowed hover:bg-initial":
            !props.isPlayButtonActive,
        }
      )}
    >
      <div className="absolute -inset-3 md:hidden" />
      <Icon className="h-4 w-4 md:w-6 md:h-6 text-white group-active:text-white/80 dark:text-slate-900 dark:group-active:text-slate-900/80" />
    </button>
  );
};
