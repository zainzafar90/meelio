import { useMeelioStore } from "@/store/meelio.store";

import { SoundTileIcon } from "./sound-tile-icon";

export const SoundList = () => {
  const { sounds } = useMeelioStore();

  return (
    <ul
      className="grid grid-cols-2 gap-x-12 gap-y-16 mb-12 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      role="list"
    >
      {sounds.map((sound) => (
        <li className="relative flex flex-col items-center" key={sound.id}>
          <SoundTileIcon sound={sound} />
        </li>
      ))}
    </ul>
  );
};
