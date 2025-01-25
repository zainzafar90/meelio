import { useState, useEffect, useRef, useCallback } from "react";
import Worker from "@/workers/heartbeat.worker?worker";

export function useWorkerTimeout() {
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker();

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "heartbeat") {
        setTick(e.data.elapsed);
      }
    };

    workerRef.current.addEventListener("message", handleMessage);
    return () => {
      workerRef.current?.removeEventListener("message", handleMessage);
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (!workerRef.current) return;

    if (running) {
      workerRef.current.postMessage({ type: "start" });
    } else {
      workerRef.current.postMessage({ type: "stop" });
    }
  }, [running]);

  const reset = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: "reset" });
    setRunning(false);
  }, []);

  return { setRunning, tick, running, reset };
} 