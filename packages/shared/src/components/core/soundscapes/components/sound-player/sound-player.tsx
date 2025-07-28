import { Player, AudioElement } from "./react-player";
import { useSoundscapesStore } from "../../../../../stores/soundscapes.store";
import { useShallow } from "zustand/shallow";
import { useCachedSound } from "../../../../../hooks/use-cached-sound";

const SoundPlayerItem = ({ sound }: { sound: any }) => {
  const cachedUrl = useCachedSound(sound);
  const { globalVolume, setSoundLoading } = useSoundscapesStore(
    useShallow((state) => ({
      globalVolume: state.globalVolume,
      setSoundLoading: state.setSoundLoading,
    }))
  );

  return (
    <Player
      activePlayer={AudioElement}
      src={cachedUrl}
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
  );
};

export const SoundPlayer = () => {
  const { sounds } = useSoundscapesStore(
    useShallow((state) => ({
      sounds: state.sounds,
    }))
  );

  const playingSounds = sounds.filter((sound) => sound.playing);

  return (
    <div>
      {playingSounds.map((sound) => (
        <SoundPlayerItem key={sound.id} sound={sound} />
      ))}
    </div>
  );
};
