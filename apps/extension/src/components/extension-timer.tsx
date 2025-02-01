import { useEffect, useState } from "react";
import { useInterval } from "@repo/shared";

export const ExtensionTimer = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "HEARTBEAT" }, (response) => {
      setTimeLeft(response.timeLeft);
      setIsRunning(response.isRunning);
      setMode(response.mode);
      console.log(response);
    });
  }, []);

  useInterval(() => {
    chrome.runtime.sendMessage({ type: "HEARTBEAT" }, (response) => {
      setTimeLeft(response.timeLeft);
      setIsRunning(response.isRunning);
      setMode(response.mode);
      console.log(response);
    });
  }, 1000);

  useEffect(() => {
    const emoji = mode === "focus" ? "🎯" : "☕";
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    document.title = `@${mins}:${secs.toString().padStart(2, "0")} ${emoji}`;
  }, [timeLeft, mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative">
      <div className="flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-shadow-lg text-5xl sm:text-7xl md:text-9xl font-semibold tracking-tighter text-white/90">
          {formatTime(timeLeft)}
        </h1>

        <div className="flex gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              chrome.runtime.sendMessage({
                type: isRunning ? "PAUSE" : "START",
              });
              setIsRunning(!isRunning);
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
        </div>
        <div className="text-white/70 text-sm">
          {mode === "focus" ? `Focus 🎯` : "Break ☕"}
        </div>
      </div>
    </div>
  );
};
