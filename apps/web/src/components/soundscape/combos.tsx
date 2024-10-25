import { useMeelioStore } from "@/stores/meelio.store";

import { SoundState } from "@/types/sound";

import { Button } from "../ui/button";

export const Combos: React.FC = () => {
  const addCombo = useMeelioStore((state) => state.addCombo);
  const deleteCombo = useMeelioStore((state) => state.deleteCombo);
  const playCombo = useMeelioStore((state) => state.playCombo);
  const combos = useMeelioStore((state) => state.combos);
  const currentlyPlayingSounds = useMeelioStore((state) =>
    state.sounds.filter((sound) => sound.playing)
  );

  const saveCurrentSoundsAsCombo = () => {
    // Assuming you have currentSounds as an array of sound objects
    // with each object having an id and volume property.
    const currentSounds: SoundState[] = currentlyPlayingSounds.map((sound) => {
      return {
        id: sound.id,
        volume: sound.volume,
      };
    });

    if (currentSounds.length > 0) {
      addCombo({
        id: Math.floor(Math.random() * 10).toString(),
        name: "New Combo",
        sounds: currentSounds as SoundState[],
      });
    }
  };

  return (
    <div className="flex gap-x-4">
      {combos.map((combo) => (
        <div key={combo.id} className="flex gap-x-4">
          <Button variant="secondary" onClick={() => playCombo(combo.id)}>
            Play
          </Button>
          <Button variant="secondary" onClick={() => deleteCombo(combo.id)}>
            Delete
          </Button>
          <p>{combo.sounds.map((s) => s.id)}</p>
        </div>
      ))}
      <Button variant="secondary" onClick={saveCurrentSoundsAsCombo}>
        Add Combo
      </Button>
    </div>
  );
};
