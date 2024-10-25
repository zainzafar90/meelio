import { useMeelioStore } from "@/stores/meelio.store";
import ReactPlayer from "react-player";

export const SoundPlayer = () => {
  const { sounds, globalVolume, setSoundLoading } = useMeelioStore(
    (state) => state
  );

  return (
    <div>
      {sounds.map((sound) => (
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
