import { Icons } from "../icons/icons";
import { useSoundscapesStore } from "../../stores/soundscapes.store";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

const navigator = (
  typeof window !== "undefined" ? window.navigator : null
) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

export const ConnectionWarning = () => {
  const [isSlow, setIsSlow] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const isAnySoundPlaying = useSoundscapesStore(
    useShallow((state) => state.sounds.some((sound) => sound.playing))
  );

  useEffect(() => {
    const updateConnectionStatus = () => {
      if (navigator.connection) {
        const effectiveType = navigator.connection.effectiveType;

        if (["2g", "slow-2g", "slow-3g"].includes(effectiveType)) {
          setIsSlow(true);
        } else {
          setIsSlow(false);
        }
      }
    };

    updateConnectionStatus(); // Initial check

    if (navigator.connection) {
      navigator.connection.addEventListener("change", updateConnectionStatus);

      // Cleanup listener on unmount
      return () => {
        navigator.connection.removeEventListener(
          "change",
          updateConnectionStatus
        );
      };
    }
  }, []);

  if (!isSlow) return null;

  return (
    <>
      {showAlert && isAnySoundPlaying && (
        <div className="pointer-events-none inset-x-0 top-14 z-40 flex w-full">
          <div className="pointer-events-auto flex items-center justify-between gap-x-6 bg-yellow-950 px-6 py-2 sm:rounded-sm w-full">
            <p className="text-sm leading-6 text-white">
              <span className="text-[12px] sm:text-sm">
                <strong className="font-semibold">Slow Network</strong>
                <svg
                  viewBox="0 0 2 2"
                  className="mx-2 inline h-0.5 w-0.5 fill-current"
                  aria-hidden="true"
                >
                  <circle cx={1} cy={1} r={1} />
                </svg>
                Sounds might take a while to load.
              </span>
            </p>
            <button
              type="button"
              className="-m-1.5 flex-none p-1.5"
              onClick={() => setShowAlert(false)}
            >
              <span className="sr-only">Dismiss</span>
              <Icons.close className="h-4 w-4 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
