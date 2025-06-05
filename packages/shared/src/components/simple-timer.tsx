import { useEffect, useState } from 'react'
import { useTimerStore } from '../stores'
import { useDocumentTitle } from '../hooks'
import {
  TimerStage,
  TimerEvent,
  TimerDurations,
} from '../types/new/pomodoro-lite'
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

const useRestoreTimer = (restore: () => void) => {
  useEffect(() => {
    restore();
  }, [restore]);
};

const useBackgroundMessages = (
  stage: TimerStage,
  durations: TimerDurations,
  updateRemaining: (n: number) => void,
  skipToStage: (s: TimerStage) => void,
  start: () => void,
  getLimitStatus: () => { isLimitReached: boolean },
) => {
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
};

interface TimerControlProps {
  running: boolean;
  stage: TimerStage;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: (s: TimerStage) => void;
  limitReached: boolean;
}

const TimerControls = ({
  running,
  stage,
  start,
  pause,
  reset,
  skip,
  limitReached,
}: TimerControlProps) => (
  <div className="space-x-2">
    {running ? (
      <button onClick={pause}>Pause</button>
    ) : (
      <button onClick={start} disabled={limitReached}>Start</button>
    )}
    <button onClick={reset}>Reset</button>
    <button onClick={() => skip(stage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus)}>
      Skip
    </button>
  </div>
);

interface TimerViewProps {
  remaining: number;
  running: boolean;
  stage: TimerStage;
  durations: TimerDurations;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: (s: TimerStage) => void;
  limitReached: boolean;
  onDurations: (d: DurationValues) => void;
}

const TimerView = ({
  remaining,
  running,
  stage,
  durations,
  start,
  pause,
  reset,
  skip,
  limitReached,
  onDurations,
}: TimerViewProps) => (
  <div className="p-4 space-y-4 text-center text-white bg-gray-900 rounded-lg">
    <div className="text-4xl font-bold">{formatTime(remaining)}</div>
    <TimerControls
      running={running}
      stage={stage}
      start={start}
      pause={pause}
      reset={reset}
      skip={skip}
      limitReached={limitReached}
    />
    <DurationEditor
      focusMin={durations[TimerStage.Focus] / 60}
      breakMin={durations[TimerStage.Break] / 60}
      onSave={onDurations}
    />
  </div>
);

/**
 * Minimal Pomodoro timer widget with editable durations.
 */
const useSimpleTimerState = () => {
  const store = useTimerStore();
  const remaining = useTimerStore((s) => {
    if (!s.endTimestamp) return s.durations[s.stage];
    return Math.max(0, Math.ceil((s.endTimestamp - Date.now()) / 1000));
  });

  useRestoreTimer(store.restore);
  useDocumentTitle({ remaining, stage: store.stage, running: store.isRunning });
  useBackgroundMessages(
    store.stage,
    store.durations,
    store.updateRemaining,
    store.skipToStage,
    store.start,
    store.getLimitStatus,
  );

  const limit = store.getLimitStatus();

  const handleDurations = (d: DurationValues) => {
    store.updateDurations({ focus: d.focusMin * 60, break: d.breakMin * 60 });
  };

  return { store, remaining, limit, handleDurations };
};

export const SimpleTimer = () => {
  const { store, remaining, limit, handleDurations } = useSimpleTimerState();
  return (
    <TimerView
      remaining={remaining}
      running={store.isRunning}
      stage={store.stage}
      durations={store.durations}
      start={store.start}
      pause={store.pause}
      reset={store.reset}
      skip={store.skipToStage}
      limitReached={limit.isLimitReached}
      onDurations={handleDurations}
    />
  );
};
