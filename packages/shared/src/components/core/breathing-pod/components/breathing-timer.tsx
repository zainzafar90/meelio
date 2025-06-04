import { useEffect } from "react";
import { toast } from "sonner";

import { playBreathingSound } from "../../../../utils/sound.utils";

import { useBreathingStore } from "../store/breathing.store";

export const useBreathingTimer = () => {
  const {
    isActive,
    phase,
    setCount,
    setPhase,
    getCurrentPhaseTime,
    getNextPhase,
    completedSets,
    totalSets,
    incrementCompletedSets,
    stop,
    selectedMethod,
  } = useBreathingStore();

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        setCount((prevCount) => {
          const currentPhaseTime = getCurrentPhaseTime();

          if (prevCount === currentPhaseTime - 1) {
            const nextPhase = getNextPhase();
            setPhase(nextPhase);
            playBreathingSound(nextPhase);

            if (nextPhase === "inhale") {
              incrementCompletedSets();
              toast("Nice work!", {
                description: "Take a moment before the next breath.",
              });

              if (completedSets + 1 >= totalSets && totalSets > 0) {
                stop();
              }
            }

            return 0;
          }
          return prevCount + 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [
    isActive,
    phase,
    getCurrentPhaseTime,
    getNextPhase,
    setCount,
    setPhase,
    completedSets,
    totalSets,
    incrementCompletedSets,
    stop,
    selectedMethod,
  ]);

  return null;
};
