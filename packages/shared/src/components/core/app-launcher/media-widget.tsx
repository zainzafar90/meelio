import { Heart, Pause, SkipBack, SkipForward } from "lucide-react";
import { useShallow } from "zustand/shallow";

import { useSoundscapesStore } from "../../../stores/soundscapes.store";
import { Icons } from "../../icons/icons";

export const MediaWidget = () => {
  const { sounds } = useSoundscapesStore(
    useShallow((state) => ({
      sounds: state.sounds,
    }))
  );

  const currentlyPlaying = sounds.find((sound) => sound.playing);

  return (
    <div className="flex flex-col items-center justify-between rounded-xl border bg-muted/30 p-4 shadow-lg backdrop-blur-xl">
      {currentlyPlaying ? (
        <>
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Icons.soundscapes className="size-6 text-primary-foreground drop-shadow-sm" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-card-foreground">
                Now Playing
              </p>
              <p className="truncate text-xs font-medium text-card-foreground/80">
                {currentlyPlaying.name}
              </p>
              <p className="text-[10px] text-muted-foreground">Soundscapes</p>
            </div>
            <button className="rounded-lg border bg-muted/50 p-1.5 text-muted-foreground backdrop-blur-sm transition-all hover:border-accent hover:bg-muted hover:text-card-foreground">
              <Heart className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button className="rounded-lg border bg-muted/50 p-2 text-muted-foreground backdrop-blur-sm transition-all hover:border-accent hover:bg-muted hover:text-card-foreground">
              <SkipBack className="size-4" />
            </button>
            <button className="flex size-9 items-center justify-center rounded-full border bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90">
              <Pause className="size-4" />
            </button>
            <button className="rounded-lg border bg-muted/50 p-2 text-muted-foreground backdrop-blur-sm transition-all hover:border-accent hover:bg-muted hover:text-card-foreground">
              <SkipForward className="size-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full py-4">
          <Icons.soundscapes className="mb-2 size-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No audio playing</p>
        </div>
      )}
    </div>
  );
};
