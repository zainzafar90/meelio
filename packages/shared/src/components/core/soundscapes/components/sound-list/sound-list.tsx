import { useSoundscapesStore } from "../../../../../stores/soundscapes.store";
import { SoundTileIcon } from "./sound-tile-icon";
import { useShallow } from "zustand/shallow";

export const SoundList = () => {
  const { sounds } = useSoundscapesStore(
    useShallow((state) => ({
      sounds: state.sounds,
    }))
  );

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3" role="list">
      {sounds.map((sound) => (
        <li className="relative flex flex-col items-center" key={sound.id}>
          <SoundTileIcon sound={sound} />
        </li>
      ))}
    </ul>
  );
};
