import { Icons } from "@/components/icons/icons";
import { VolumeSlider } from "@/components/ui/volume-slider";
import { useMeelioStore } from "@/store/meelio.store";

export const GlobalVolumeControl = () => {
  const { globalVolume, setGlobalVolume } = useMeelioStore();

  return (
    <>
      <Icons.volume className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
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
