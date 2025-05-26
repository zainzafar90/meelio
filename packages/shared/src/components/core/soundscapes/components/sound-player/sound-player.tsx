import { Player, AudioElement } from "./react-player";
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
        <Player
          key={sound.id}
          activePlayer={AudioElement}
          src={sound.url}
          playing={sound.playing}
          volume={sound.volume * globalVolume}
          loop={true}
          height={0}
          width={0}
          muted={false}
          playsInline
          style={{ display: "none" }}
          onReady={() => {
            setSoundLoading(sound.id, false);
          }}
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
