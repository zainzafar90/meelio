import { webTimerService } from "@/services/timer.service";
import { useEffect } from "react";
import { formatTime, useTimer } from "@repo/shared";
import { useState } from "react";

export const WebTimer = () => {
  const timer = useTimer(webTimerService);
  const [focusedMinutes, setFocusedMinutes] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(0);

  useEffect(() => {
    const emoji = timer.mode === 'focus' ? '🎯' : '☕';
    const timeStr = formatTime(timer.timeLeft);
    document.title = timer.isRunning
      ? `${focusedMinutes}:${breakMinutes} ${emoji} ${timeStr} - ${timer.mode === 'focus' ? 'Focus' : 'Break'}`
      : 'Meelio - focus, calm, & productivity';
  }, [timer.timeLeft, timer.mode, timer.isRunning, focusedMinutes, breakMinutes]);

  useEffect(() => {
    if (timer.mode === 'focus') {
      setFocusedMinutes(prev => prev + 25);
    } else {
      setBreakMinutes(prev => prev + 5);
    }
  }, [timer.mode]);

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    timer.start();
  }

  const handlePause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    timer.pause();
  }

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    timer.reset();
  }

  const handleSwitch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    timer.setMode(timer.mode === 'focus' ? 'break' : 'focus');
  }


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
              Start {timer.mode === 'focus' ? 'Focus' : 'Break'}
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