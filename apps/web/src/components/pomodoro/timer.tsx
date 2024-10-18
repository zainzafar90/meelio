import React, { useEffect, useRef, useState } from "react";

import Worker from "@/workers/timer.worker?worker";
import { CheckCircle2 } from "lucide-react";

import { PomodoroStage, PomodoroStageMap } from "@/types/pomodoro";
import { usePomodoroStore } from "@/store/pomodoro.store";
import { playPomodoroSound } from "@/utils/sound.utils";
import { getTime } from "@/utils/timer.utils";

import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { FlipClockPiece } from "./flip-clock-piece";
import { PomodoroSettingsDialog } from "./pomodoro-settings.dialog";

export const Timer: React.FC = () => {
  const {
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    updateTimer,
    advanceTimer,
    changeStage,
  } = usePomodoroStore();

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker();
    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "tick") {
        updateTimer(e.data.remaining);
      } else if (e.data.type === "complete") {
        if (timer.enableSound) playPomodoroSound("timeout");
        advanceTimer();
      }
    };

    worker.addEventListener("message", handleMessage);
    return () => worker.removeEventListener("message", handleMessage);
  }, [timer.enableSound, updateTimer, advanceTimer]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    if (timer.running) {
      worker.postMessage({ command: "start", duration: timer.remaining });
    } else {
      worker.postMessage({ command: "pause" });
    }
  }, [timer.running, timer.remaining]);

  const handleStartPause = () => {
    if (timer.running) {
      pauseTimer();
    } else if (timer.remaining === timer.stageSeconds[timer.activeStage]) {
      startTimer();
    } else {
      resumeTimer();
    }
  };

  const [minutesTens, minutesUnit, secondsTens, secondsUnit] = getTime(
    timer.remaining
  );

  return (
    <div>
      <StageSelector
        activeStage={timer.activeStage}
        onChangeStage={changeStage}
      />

      <TimerDisplay
        minutesTens={minutesTens || "0"}
        minutesUnit={minutesUnit || "0"}
        secondsTens={secondsTens}
        secondsUnit={secondsUnit}
      />

      <TimerControls
        isRunning={timer.running}
        onStartPause={handleStartPause}
        onReset={resetTimer}
        onOpenSettings={() => setShowSettingsDialog(true)}
      />

      <SessionProgress
        sessionCount={timer.sessionCount}
        longBreakInterval={timer.longBreakInterval}
      />

      <PomodoroSettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </div>
  );
};

const StageSelector: React.FC<{
  activeStage: PomodoroStage;
  onChangeStage: (stage: PomodoroStage) => void;
}> = ({ activeStage, onChangeStage }) => (
  <RadioGroup
    value={activeStage.toString()}
    onValueChange={(value) => onChangeStage(parseInt(value) as PomodoroStage)}
    className="grid grid-cols-3 gap-4 mb-4"
  >
    {Object.values(PomodoroStage)
      .filter((v) => !isNaN(Number(v)))
      .map((stage) => (
        <div key={stage}>
          <RadioGroupItem
            value={stage.toString()}
            id={stage.toString()}
            className="peer sr-only"
          />
          <Label
            htmlFor={stage.toString()}
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-secondary hover:text-secondary-foreground peer-data-[state=checked]:border-primary cursor-pointer select-none"
          >
            {PomodoroStageMap[stage as PomodoroStage]}
          </Label>
        </div>
      ))}
  </RadioGroup>
);

const TimerDisplay: React.FC<{
  minutesTens: string;
  minutesUnit: string;
  secondsTens: string;
  secondsUnit: string;
}> = ({ minutesTens, minutesUnit, secondsTens, secondsUnit }) => (
  <div className="flex justify-center gap-x-4 mb-4">
    <FlipClockPiece interval={minutesTens} />
    <FlipClockPiece interval={minutesUnit} />
    <FlipClockPiece interval={secondsTens} />
    <FlipClockPiece interval={secondsUnit} />
  </div>
);

const TimerControls: React.FC<{
  isRunning: boolean;
  onStartPause: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
}> = ({ isRunning, onStartPause, onReset, onOpenSettings }) => (
  <div className="mx-auto max-w-xl p-1 py-4 flex items-center space-x-2">
    <Button className="px-8" size="lg" fullWidth onClick={onStartPause}>
      {isRunning ? "Pause" : "Start"}
    </Button>
    <Button size="lg" variant="secondary" onClick={onReset}>
      Reset
    </Button>
    <Button size="lg" variant="secondary" onClick={onOpenSettings}>
      Settings
    </Button>
  </div>
);

const SessionProgress: React.FC<{
  sessionCount: number;
  longBreakInterval: number;
}> = ({ sessionCount, longBreakInterval }) => {
  const completedIntervals = Math.floor(sessionCount / longBreakInterval);
  const currentIntervalSessions = sessionCount % longBreakInterval;

  const renderSessionIndicators = () => {
    return Array(longBreakInterval)
      .fill(0)
      .map((_, index) => (
        <div key={index} className="w-5 h-5 flex items-center justify-center">
          {index < currentIntervalSessions || index === 4 ? (
            <CheckCircle2 className="text-green-600 w-5 h-5" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
          )}
        </div>
      ));
  };

  return (
    <div className="flex justify-center mt-4 max-w-xs mx-auto gap-2">
      <div className="flex justify-center items-center space-x-3 mb-2 border dark:border-zinc-800 dark:bg-zinc-900 border-zinc-100 bg-zinc-50 p-2 rounded-md">
        {renderSessionIndicators()}
      </div>
      {completedIntervals > 0 && (
        <div className="flex justify-center items-center space-x-1 mb-2 border dark:border-zinc-800 dark:bg-zinc-900 border-zinc-100 bg-zinc-50 p-2 rounded-md">
          🔥
          <span className="text-sm font-medium ml-1">{completedIntervals}</span>
        </div>
      )}
    </div>
  );
};
