import ReactPlayer from "react-player/file";
import { Sound } from "../../../../../types/sound";
import { useSoundscapesStore } from "../../../../../stores/soundscapes.store";
import { useShallow } from "zustand/shallow";

export const SoundPlayer = () => {
  const { sounds, globalVolume, setSoundLoading } = useSoundscapesStore(
    useShallow((state) => ({
      sounds: state.sounds,
      globalVolume: state.globalVolume,
      setSoundLoading: state.setSoundLoading,
    }))
  );

  const playingSounds = sounds.filter((sound) => sound.playing);

  return (
    <div>
      {playingSounds.map((sound) => (
        <ReactPlayer
          key={sound.id}
          url={sound.url}
          playing={sound.playing}
          volume={sound.volume * globalVolume}
          loop={true}
          height={0}
          width={0}
          playsinline
          muted={false}
          onBuffer={() => {
            setSoundLoading(sound.id, true);
          }}
          onBufferEnd={() => {
            setSoundLoading(sound.id, false);
          }}
        />
      ))}
    </div>
  );
};
