import { useSoundscapesStore } from "@/stores/soundscapes.store";

import { SoundTileIcon } from "./sound-tile-icon";

export const SoundList = () => {
  const { sounds } = useSoundscapesStore();

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
