
import { useEffect } from "react";
import { formatTime, Icons, TimerSettingsDialog,  TimerState,  TimerStatsDialog, useDisclosure, useInterval } from "@repo/shared";
import { useState } from "react";

import TimerWorker from '../workers/timer-worker?worker';

const worker = new TimerWorker();

export const WebTimer = () => {
  const [focusedMinutes, setFocusedMinutes] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const { isOpen: isStatsDialogOpen, toggle: toggleStatsDialog } = useDisclosure();
  const { isOpen: isSettingsDialogOpen, toggle: toggleSettingsDialog } = useDisclosure();

  const [timer, setTimer] = useState<TimerState>({
    timeLeft: 25 * 60,
    isRunning: false,
    mode: "focus",
  });


  const heartbeatListener = (event: any) => {
    if (event.data.type === 'TICK') {
      setTimer({
        timeLeft: event.data.timeLeft,
        isRunning: event.data.isRunning,
        mode: event.data.mode,
      });
    }
  };

  useEffect(() => {
    worker.onmessage = heartbeatListener;
  }, []);

  useInterval(() => {
    worker.onmessage = heartbeatListener;
  }, 1000);

  // TODO: remove listener when component unmounts
  // useEffect(() => {
  //   return () => {
  //     worker.onmessage = null;
  //     worker.terminate();
  //   };
  // }, []);

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
    worker.postMessage({ type: 'START' });
  }

  const handlePause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    worker.postMessage({ type: 'PAUSE' });
  }

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    worker.postMessage({ type: 'RESET' });
  }

  const handleSwitch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    worker.postMessage({ type: 'SET_MODE', mode: timer.mode === 'focus' ? 'break' : 'focus' });
  }

  return (
    <div className="relative">
      <div className="max-w-full w-80 sm:w-[400px] backdrop-blur-xl bg-white/5 rounded-3xl shadow-lg text-white">
        <div className="p-6 space-y-10">
          {/* Timer Mode Tabs */}
          <div className="w-full">
            <div className="w-full h-12 rounded-full bg-gray-100/10 text-black p-1 flex">
              <button
                onClick={handleSwitch}
                className={(`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${timer.mode === 'focus' ? 'bg-white/50' : ''
                  }`)}
              >
                <span>Focus</span>
              </button>
              <button
                onClick={handleSwitch}
                className={(`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${timer.mode === 'break' ? 'bg-white/50' : ''
                  }`)}
              >
                <span>Break</span>
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="text-9xl font-bold tracking-normal">
              {formatTime(timer.timeLeft)}
            </div>

          </div>

          {/* Current Task
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl">{timer.mode === 'focus' ? '🎯' : '☕'}</span>
            <p className="font-medium truncate">
              {timer.mode === 'focus' ? 'Focus Time' : 'Break Time'}
            </p>
          </div> */}

          <div className="flex flex-col gap-4">

            {/* Control Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm "
                onClick={handleReset}
                title="Reset timer"
                role="button"
              >
                <Icons.resetTimer className="size-4 text-white/90" />
                <span className="sr-only">Reset timer</span>
              </button>

              <button
                className="cursor-pointer relative flex h-10 w-full items-center justify-center rounded-full shadow-lg bg-gradient-to-b from-zinc-800 to-zinc-900 text-white/90 backdrop-blur-sm "
                onClick={timer.isRunning ? handlePause : handleStart}
                title="Switch timer"
                role="button"
              >
                {timer.isRunning ? <Icons.pause className="size-4" /> : <Icons.play className="size-4" />}
                <span className="ml-2 uppercase">{timer.isRunning ? 'Stop' : 'Start'}</span>
              </button>


              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm "
                onClick={handleSwitch}
                title="Switch timer"
                role="button"
              >
                <Icons.forward className="size-4 text-white/90" />
                <span className="sr-only">Switch to next timer</span>
              </button>

              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm "
                onClick={toggleStatsDialog}
                title="Stats"
                role="button"
              >
                <Icons.graph className="size-4 text-white/90" />
                <span className="sr-only">Stats</span>
              </button>

            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-200/20 rounded-full">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{
                  width: `${(timer.timeLeft / (timer.mode === 'focus' ? 25 * 60 : 5 * 60)) * 50}%`
                }}
                role="progressbar"
                aria-valuenow={(timer.timeLeft / (timer.mode === 'focus' ? 25 * 60 : 5 * 60)) * 100}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

        </div>
      </div>

      <TimerStatsDialog
        isOpen={isStatsDialogOpen}
        onOpenChange={toggleStatsDialog}
        onSettingsClick={toggleSettingsDialog}
      />

      <TimerSettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={toggleSettingsDialog}
      />
    </div>
  );
};