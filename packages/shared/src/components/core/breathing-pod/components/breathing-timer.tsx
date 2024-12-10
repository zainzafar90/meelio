import { useEffect } from "react";

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
            playBreathingSound(phase);
            return 0;
          }
          return prevCount + 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, phase, getCurrentPhaseTime, getNextPhase, setCount, setPhase]);

  return null;
};
