import React, { useEffect, useRef, useState } from "react";

import Worker from "@/workers/timer.worker?worker";

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
      <RadioGroup
        value={timer.activeStage.toString()}
        onValueChange={(value) => changeStage(parseInt(value) as PomodoroStage)}
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

      <div className="flex justify-center gap-x-4 mb-4">
        <FlipClockPiece interval={minutesTens} />
        <FlipClockPiece interval={minutesUnit} />
        <FlipClockPiece interval={secondsTens} />
        <FlipClockPiece interval={secondsUnit} />
      </div>

      <div className="mx-auto max-w-xl p-1 py-4 flex items-center space-x-2">
        <Button className="px-8" size="lg" fullWidth onClick={handleStartPause}>
          {timer.running ? "Pause" : "Start"}
        </Button>
        <Button size="lg" variant="secondary" onClick={resetTimer}>
          Reset
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => setShowSettingsDialog(true)}
        >
          Settings
        </Button>
      </div>

      <div className="text-center">
        <p>
          Session: {timer.sessionCount + 1} / {timer.longBreakInterval}
        </p>
      </div>

      <PomodoroSettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </div>
  );
};
