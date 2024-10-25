import React, { useState } from "react";

import { usePomodoroStore } from "@/stores/pomodoro.store";

import { PomodoroStage, PomodoroStageMap } from "@/types/pomodoro";
import { cn } from "@/lib/utils";
import { getTime } from "@/utils/timer.utils";

import { Icons } from "../icons/icons";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { FlipClockPiece } from "./flip-clock-piece";
import { PomodoroSettingsDialog } from "./pomodoro-settings.dialog";

export const Timer: React.FC = () => {
  const { timer, startTimer, pauseTimer, resumeTimer, changeStage } =
    usePomodoroStore();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

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
    className="flex justify-center gap-x-4 mb-4"
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
            className={cn(
              "flex flex-col items-center justify-between text-xs rounded-md p-3 bg-secondary/25 hover:bg-secondary/75 hover:text-secondary-foreground peer-data-[state=checked]:border-primary/50 cursor-pointer select-none",
              {
                "bg-secondary/50": activeStage === stage,
              }
            )}
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
  onOpenSettings: () => void;
}> = ({ isRunning, onStartPause, onOpenSettings }) => {
  return (
    <div className="mx-auto max-w-2xl p-1 pt-4 flex items-center justify-center space-x-2">
      <Button
        size="icon"
        variant={isRunning ? "default" : "secondary"}
        onClick={onStartPause}
      >
        {isRunning ? (
          <Icons.pause className="size-5" />
        ) : (
          <Icons.play className="size-5" />
        )}
      </Button>

      <Button size="icon" variant="secondary" onClick={onOpenSettings}>
        <Icons.settings className="size-5" />
      </Button>
    </div>
  );
};
