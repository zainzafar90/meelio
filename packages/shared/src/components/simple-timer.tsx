import { useEffect, useState } from 'react'
import { useTimerStore } from '../stores'
import { useDocumentTitle } from '../hooks'
import { TimerStage, TimerEvent } from '../types/new/pomodoro-lite'
import { isChromeExtension } from '../utils/common.utils'
import { formatTime } from '../utils/timer.utils'

interface DurationValues {
  focusMin: number;
  breakMin: number;
}

interface DurationEditorProps extends DurationValues {
  onSave: (v: DurationValues) => void;
}

const DurationEditor = ({
  focusMin,
  breakMin,
  onSave,
}: DurationEditorProps) => {
  const [focus, setFocus] = useState(focusMin);
  const [brk, setBreak] = useState(breakMin);
  return (
    <div className="space-x-2">
      <input
        type="number"
        className="w-16 text-black"
        value={focus}
        onChange={(e) => setFocus(Number(e.target.value))}
      />
      <input
        type="number"
        className="w-16 text-black"
        value={brk}
        onChange={(e) => setBreak(Number(e.target.value))}
      />
      <button onClick={() => onSave({ focusMin: focus, breakMin: brk })}>
        Save
      </button>
    </div>
  );
};

/**
 * Minimal Pomodoro timer widget with editable durations.
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
    updateDurations,
    getLimitStatus,
    restore,
  } = useTimerStore();

  const remaining = useTimerStore((s) => {
    if (!s.endTimestamp) return s.durations[s.stage];
    const diff = Math.max(0, Math.ceil((s.endTimestamp - Date.now()) / 1000));
    return diff;
  });

  useEffect(() => {
    restore();
  }, [restore]);

  useDocumentTitle({ remaining, stage, running: isRunning });

  useEffect(() => {
    if (!isChromeExtension()) return;
    const handler = (msg: TimerEvent) => {
      switch (msg.type) {
        case 'TICK':
          updateRemaining(msg.remaining);
          break;
        case 'STAGE_COMPLETE':
          const next =
            stage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus;
          skipToStage(next);
          if (!getLimitStatus().isLimitReached) start();
          break;
        case 'PAUSED':
          updateRemaining(msg.remaining);
          break;
        case 'RESET_COMPLETE':
          updateRemaining(durations[stage]);
          break;
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, [stage, durations, updateRemaining, skipToStage, start, getLimitStatus]);

  const limit = getLimitStatus();

  const handleDurations = (d: DurationValues) => {
    updateDurations({ focus: d.focusMin * 60, break: d.breakMin * 60 });
  };

  return (
    <div className="p-4 space-y-4 text-center text-white bg-gray-900 rounded-lg">
      <div className="text-4xl font-bold">{formatTime(remaining)}</div>
      <div className="space-x-2">
        {isRunning ? (
          <button onClick={pause}>Pause</button>
        ) : (
          <button onClick={start} disabled={limit.isLimitReached}>
            Start
          </button>
        )}
        <button onClick={reset}>Reset</button>
        <button
          onClick={() =>
            skipToStage(
              stage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus,
            )
          }
        >
          Skip
        </button>
      </div>
      <DurationEditor
        focusMin={durations[TimerStage.Focus] / 60}
        breakMin={durations[TimerStage.Break] / 60}
        onSave={handleDurations}
      />
    </div>
  );
};
