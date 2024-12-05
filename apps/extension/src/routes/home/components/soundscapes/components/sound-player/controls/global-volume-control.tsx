import { VolumeSlider } from "@repo/ui/components/ui/volume-slider";

import { Icons } from "@/components/icons/icons";
import { useSoundscapesStore } from "@/stores/soundscapes.store";

export const GlobalVolumeControl = () => {
  const { globalVolume, setGlobalVolume } = useSoundscapesStore();

  return (
    <>
      <Icons.volume className="h-5 w-5 flex-shrink-0 md:h-6 md:w-6" />
      <VolumeSlider
        min={0}
        max={1}
        step={0.01}
        value={[globalVolume]}
        id="global-volume"
        aria-label="Global Volume"
        className="w-full max-w-[10rem]"
        onValueChange={(v) => {
          setGlobalVolume(v[0] || 0);
        }}
      />
    </>
  );
};
