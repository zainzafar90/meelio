import { Player, AudioElement } from "./react-player";
import { useSoundscapesStore } from "../../../../../stores/soundscapes.store";
import { useShallow } from "zustand/shallow";
import { useCachedSoundUrl } from "../../../../../hooks/use-cached-sound-url";

const SoundPlayerItem = ({ sound }: { sound: any }) => {
  const soundUrl = useCachedSoundUrl(sound.url);
  const { globalVolume, setSoundLoading } = useSoundscapesStore(
    useShallow((state) => ({
      globalVolume: state.globalVolume,
      setSoundLoading: state.setSoundLoading,
    }))
  );

  if (!soundUrl) return null;

  return (
    <Player
      activePlayer={AudioElement}
      src={soundUrl}
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
