import { useEffect, useState } from "react";
import { formatTime, TimerState, useInterval } from "@repo/shared";

export const ExtensionTimer = () => {
  const [timer, setTimer] = useState<TimerState>({
    timeLeft: 0,
    isRunning: false,
    mode: "focus",
  });
  const [focusedMinutes, setFocusedMinutes] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(0);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "HEARTBEAT" }, (response) => {
      setTimer({
        timeLeft: response.timeLeft,
        isRunning: response.isRunning,
        mode: response.mode,
      });
    });
  }, []);

  useInterval(() => {
    chrome.runtime.sendMessage({ type: "HEARTBEAT" }, (response) => {
      setTimer({
        timeLeft: response.timeLeft,
        isRunning: response.isRunning,
        mode: response.mode,
      });
    });
  }, 1000);

  useEffect(() => {
    if (timer.mode === 'focus') {
      setFocusedMinutes(prev => prev + 25);
    } else {
      setBreakMinutes(prev => prev + 5);
    }
  }, [timer.mode]);

  useEffect(() => {
    const emoji = timer.mode === 'focus' ? '🎯' : '☕';
    const timeStr = formatTime(timer.timeLeft);
    document.title = timer.isRunning
      ? `${focusedMinutes}:${breakMinutes} ${emoji} ${timeStr} - ${timer.mode === 'focus' ? 'Focus' : 'Break'}`
      : 'Meelio - focus, calm, & productivity';
  }, [timer.timeLeft, timer.mode, timer.isRunning, focusedMinutes, breakMinutes]);

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: "START" });
  }

  const handlePause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: "PAUSE" });
  }

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: "RESET" });
  }
  const handleSwitch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: "SET_MODE", mode: timer.mode });
  }

  console.log(timer);

  return (
    <div className="relative">
      <div className="flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-shadow-lg text-5xl sm:text-7xl md:text-9xl font-semibold tracking-tighter text-white/90">
          {formatTime(timer.timeLeft)}
        </h1>

        <div className="flex gap-4">
          {!timer.isRunning ? (
            <button
              onClick={handleStart}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
            >
              Start 
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
            >
              Pause
            </button>
          )}

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
          >
            Reset
          </button>

          <button
            onClick={handleSwitch}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 backdrop-blur-md transition-colors"
          >
            Switch to {timer.mode === 'focus' ? 'Break' : 'Focus'}
          </button>
        </div>
        <div className="text-white/70 text-sm">
          {timer.mode === 'focus' ? '🎯 Focus Time' : '☕ Break Time'}
        </div>
      </div>
    </div>
  );
};
