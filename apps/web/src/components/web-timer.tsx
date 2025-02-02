import { useEffect, useRef, useState } from "react";
import { PomodoroState, usePomodoroStore } from "../lib/pomodoro-store";
import { formatTime, Icons, PomodoroStage, TimerSettingsDialog, TimerStatsDialog, useDisclosure } from "@repo/shared";
import { Spinner } from '@repo/ui/components/ui/spinner';

import TimerWorker from '../workers/timer-worker?worker';

export const WebTimer = () => {
  const workerRef = useRef<Worker>();
  const { isOpen: isStatsDialogOpen, toggle: toggleStatsDialog } = useDisclosure();
  const { isOpen: isSettingsDialogOpen, toggle: toggleSettingsDialog } = useDisclosure();
  
  const {
    activeStage,
    isRunning,
    startTimestamp,
    stageDurations
  } = usePomodoroStore();

  const [remaining, setRemaining] = useState(stageDurations[activeStage]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    workerRef.current = new TimerWorker();
    
    const handleMessage = ({ data }: MessageEvent) => {
      switch(data.type) {
        case 'TICK':
          setIsLoading(false);
          setRemaining(data.remaining);
          break;
          
        case 'STAGE_COMPLETE':
          completeStage();
          break;
          
        case 'PAUSED':
          usePomodoroStore.setState({
            isRunning: false,
            lastUpdated: Date.now()
          });
          break;
      }
    };

    workerRef.current.onmessage = handleMessage;
    return () => workerRef.current?.terminate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRunning && startTimestamp && workerRef.current) {
      setIsLoading(true);
      const elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000);
      const originalDuration = stageDurations[activeStage];
      const remainingTime = originalDuration - elapsedSeconds;
      if (remainingTime > 0) {
        workerRef.current.postMessage({ type: 'START', payload: { duration: remainingTime } });
      } else {
        workerRef.current.postMessage({ type: 'STAGE_COMPLETE' });
      }
    }
  }, [isRunning, startTimestamp, activeStage, stageDurations]);

  useEffect(() => {
    const emoji = activeStage === PomodoroStage.WorkTime ? '🎯' : '☕';
    const timeStr = formatTime(remaining);
    const mode = activeStage === PomodoroStage.WorkTime ? 'Focus' : 'Break';
    console.log('document.title', document.title);
    document.title = isRunning ? `${emoji} ${timeStr} - ${mode}` : 'Meelio - focus, calm, & productivity';
  }, [remaining, activeStage, isRunning, stageDurations]);

  const completeStage = () => {
    const state = usePomodoroStore.getState();
    const newStats = { ...state.stats };
    const isFocus = state.activeStage === PomodoroStage.WorkTime;

    if (isFocus) {
      newStats.todaysFocusSessions += 1;
      newStats.todaysFocusTime += state.stageDurations[PomodoroStage.WorkTime];
    } else {
      if (state.activeStage === PomodoroStage.ShortBreak) newStats.todaysShortBreaks += 1;
      else newStats.todaysLongBreaks += 1;
    }

    const nextStage = getNextStage(state);
    const newSessionCount = isFocus ? state.sessionCount + 1 : state.sessionCount;

    usePomodoroStore.setState({
      stats: newStats,
      activeStage: nextStage,
      sessionCount: newSessionCount,
      isRunning: false,
      startTimestamp: null,
      lastUpdated: Date.now()
    });

    if (nextStage !== state.activeStage) {
      workerRef.current?.postMessage({
        type: 'UPDATE_DURATION',
        payload: { duration: state.stageDurations[nextStage] }
      });
    }
  };

  const getNextStage = (state: PomodoroState) => {
    if (state.activeStage === PomodoroStage.WorkTime) {
      return state.sessionCount + 1 >= state.longBreakInterval 
        ? PomodoroStage.LongBreak
        : PomodoroStage.ShortBreak;
    }
    return PomodoroStage.WorkTime;
  };

  const handleStart = () => {
    const duration = usePomodoroStore.getState().stageDurations[activeStage];
    workerRef.current?.postMessage({ 
      type: 'START',
      payload: { duration }
    });
    usePomodoroStore.setState({
      isRunning: true,
      startTimestamp: Date.now(),
      lastUpdated: Date.now()
    });
  };

  const handlePause = () => {
    workerRef.current?.postMessage({ type: 'PAUSE' });
  };

  const handleReset = () => {
    workerRef.current?.postMessage({ type: 'RESET' });
    usePomodoroStore.setState({
      isRunning: false,
      startTimestamp: null,
      sessionCount: 0,
      activeStage: PomodoroStage.WorkTime,
      lastUpdated: Date.now()
    });
  };

  const handleSwitch = () => {
    const nextStage = getNextStage(usePomodoroStore.getState());
    workerRef.current?.postMessage({
      type: 'UPDATE_DURATION',
      payload: { duration: stageDurations[nextStage] }
    });
    usePomodoroStore.setState({
      activeStage: nextStage,
      isRunning: false,
      startTimestamp: null,
      lastUpdated: Date.now()
    });
  };



  return (
    <div className="relative">
      <div className="max-w-full w-80 sm:w-[400px] backdrop-blur-xl bg-white/5 rounded-3xl shadow-lg text-white">
        <div className="p-6 space-y-10">
          {/* Timer Mode Tabs */}
          <div className="w-full">
            <div className="w-full h-12 rounded-full bg-gray-100/10 text-black p-1 flex">
              <button
                onClick={handleSwitch}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                  activeStage === PomodoroStage.WorkTime ? 'bg-white/50' : ''
                }`}
              >
                <span>Focus</span>
              </button>
              <button
                onClick={handleSwitch}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                    activeStage === PomodoroStage.ShortBreak || activeStage === PomodoroStage.LongBreak ? 'bg-white/50' : ''
                }`}
              >
                <span>Break</span>
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="text-9xl font-bold tracking-normal">
             {isLoading ? <Spinner className="inline-block ml-2 w-4 h-4" /> : formatTime(remaining)}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Control Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                onClick={handleReset}
                title="Reset timer"
                role="button"
              >
                <Icons.resetTimer className="size-4 text-white/90" />
                <span className="sr-only">Reset timer</span>
              </button>

              <button
                className="cursor-pointer relative flex h-10 w-full items-center justify-center rounded-full shadow-lg bg-gradient-to-b from-zinc-800 to-zinc-900 text-white/90 backdrop-blur-sm"
                onClick={isRunning ? handlePause : handleStart}
                title="Switch timer"
                role="button"
              >
                {isRunning ? <Icons.pause className="size-4" /> : <Icons.play className="size-4" />}
                <span className="ml-2 uppercase">{isRunning ? 'Stop' : 'Start'}</span>
              </button>

              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                onClick={handleSwitch}
                title="Switch timer"
                role="button"
              >
                <Icons.forward className="size-4 text-white/90" />
                <span className="sr-only">Switch to next timer</span>
              </button>

              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
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
                  width: `${((stageDurations[activeStage] - remaining) / stageDurations[activeStage]) * 100}%`
                }}
                role="progressbar"
                aria-valuenow={((stageDurations[activeStage] - remaining) / stageDurations[activeStage]) * 100}
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