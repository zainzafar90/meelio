import { useEffect } from 'react';
import { useTimerStore } from '../stores';
import { TimerStage } from '../types/new/pomodoro-lite';
import { formatTime } from '../utils/timer.utils';

/**
 * Minimal Pomodoro timer widget.
 */
export const SimpleTimer = () => {
  const {
    stage,
    isRunning,
    durations,
    start,
    pause,
    reset,
    skipToStage,
    updateRemaining,
    getLimitStatus,
  } = useTimerStore();

  const remaining = useTimerStore((s) => {
    if (!s.endTimestamp) return s.durations[s.stage];
    const diff = Math.max(0, Math.ceil((s.endTimestamp - Date.now()) / 1000));
    return diff;
  });

  useEffect(() => {
    const id = setInterval(() => {
      if (isRunning && useTimerStore.getState().endTimestamp) {
        const left = Math.max(
          0,
          Math.ceil((useTimerStore.getState().endTimestamp! - Date.now()) / 1000)
        );
        updateRemaining(left);
        if (left === 0) {
          const next = stage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus;
          skipToStage(next);
          start();
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, stage, start, skipToStage, updateRemaining]);

  const limit = getLimitStatus();

  return (
    <div className="p-4 space-y-4 text-center text-white bg-gray-900 rounded-lg">
      <div className="text-4xl font-bold">{formatTime(remaining)}</div>
      <div className="space-x-2">
        {isRunning ? (
          <button onClick={pause}>Pause</button>
        ) : (
          <button
            onClick={start}
            disabled={limit.isLimitReached}
          >
            Start
          </button>
        )}
        <button onClick={reset}>Reset</button>
        <button
          onClick={() => skipToStage(stage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus)}
        >
          Skip
        </button>
      </div>
    </div>
  );
};
