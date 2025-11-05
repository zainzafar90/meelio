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
    <div className="flex flex-col items-center justify-between rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 shadow-lg backdrop-blur-xl">
      {currentlyPlaying ? (
        <>
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Icons.soundscapes className="size-6 text-white drop-shadow-sm" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-white/90">
                Now Playing
              </p>
              <p className="truncate text-xs font-medium text-white/70">
                {currentlyPlaying.name}
              </p>
              <p className="text-[10px] text-white/50">Soundscapes</p>
            </div>
            <button className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/60 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
              <Heart className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
              <SkipBack className="size-4" />
            </button>
            <button className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white shadow-lg transition-all hover:scale-105 hover:bg-white/95">
              <Pause className="size-4 text-black" />
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
              <SkipForward className="size-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full py-4">
          <Icons.soundscapes className="mb-2 size-8 text-white/30" />
          <p className="text-xs text-white/40">No audio playing</p>
        </div>
      )}
    </div>
  );
};
