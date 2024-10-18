import React, { useEffect, useState } from "react";

import Worker from "@/workers/timer.worker?worker";

import { PomodoroStage, PomodoroStageMap } from "@/types/pomodoro";
import { usePomodoroStore } from "@/store/pomodoro.store";
import { changeFavicon } from "@/utils/favicon.utils";
import { playPomodoroSound } from "@/utils/sound.utils";
import { getTime } from "@/utils/timer.utils";

import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { FlipClockPiece } from "./flip-clock-piece";
import { PomodoroSettingsDialog } from "./pomodoro-settings.dialog";

const worker = new Worker();

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

  useEffect(() => {
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
    if (!worker) return;

    if (timer.running) {
      worker.postMessage({ command: "start", duration: timer.remaining });
    } else {
      worker.postMessage({ command: "pause" });
    }
  }, [timer.running, timer.remaining]);

  useEffect(() => {
    const isBreak =
      timer.activeStage === PomodoroStage.ShortBreak ||
      timer.activeStage === PomodoroStage.LongBreak;
    const faviconPath = isBreak ? "/favicon-break.ico" : "/favicon.ico";
    changeFavicon(faviconPath);
  }, [timer.activeStage]);

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
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 bg-primary-foreground hover:bg-secondary hover:text-secondary-foreground peer-data-[state=checked]:border-primary cursor-pointer select-none"
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
    <div />
    <div />
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
