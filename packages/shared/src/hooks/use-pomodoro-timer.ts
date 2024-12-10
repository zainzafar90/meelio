import { useEffect, useRef } from "react";
import { TimerWorkerWrapper } from "../workers/timer.wrapper";

export function usePomodoroTimer(
  duration: number,
  onTick?: () => void,
  onComplete?: () => void
) {
  const workerRef = useRef<TimerWorkerWrapper | null>(null);

  useEffect(() => {
    workerRef.current = new TimerWorkerWrapper();

    workerRef.current.on("TICK", () => {
      onTick?.();
    });

    workerRef.current.on("COMPLETE", () => {
      onComplete?.();
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, [onTick, onComplete]);

  const startTimer = () => {
    workerRef.current?.postMessage({ type: "START", duration });
  };

  const stopTimer = () => {
    workerRef.current?.postMessage({ type: "STOP" });
  };

  return { startTimer, stopTimer };
}
