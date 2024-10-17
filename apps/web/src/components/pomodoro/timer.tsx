import { useEffect, useState } from "react";

import Worker from "@/workers/timer.worker?worker";

import { PomodoroStage, PomodoroStageMap } from "@/types/pomodoro";
import { cn } from "@/lib/utils";
import { useMeelioStore } from "@/store/meelio.store";
import { playPomodoroSound } from "@/utils/sound.utils";
import { getTime } from "@/utils/timer.utils";

import { Icons } from "../icons/icons";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { FlipClockPiece } from "./flip-clock-piece";
import { PomodoroSettingsDialog } from "./pomodoro-settings.dialog";

const worker = new Worker();

export const Timer = () => {
  const {
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    updateTimer,
    sessionCompleted,
    nextStage,
    changeStage,
    advanceTimer,
  } = useMeelioStore((state) => state);

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const [minutesTens, minutesUnit, secondsTens, secondsUnit] = getTime(
    timer.remaining
  );

  useEffect(() => {
    if (!timer.running) {
      return;
    }

    worker.addEventListener("message", (event) => {
      if (event.data.type === "tick") {
        const remaining = timer.remaining - event.data.elapsed;
        updateTimer(remaining);
      } else if (event.data.type === "stage-completed") {
        if (timer.activeStage === PomodoroStage.LongBreak) {
          sessionCompleted();
        }
        advanceTimer();
        playPomodoroSound("timeout");
      }
    });

    return () => worker.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.running, timer.activeStage]);

  const handleStartTimer = () => {
    if (!timer.running && !timer.paused) {
      worker.postMessage({ command: "start", newDuration: timer.remaining });
      startTimer();
      return;
    }

    if (timer.running) {
      worker.postMessage({ command: "pause" });
      pauseTimer();
      return;
    }

    if (timer.paused) {
      worker.postMessage({ command: "resume" });
      resumeTimer();
    }

    // if (!timer.running && !timer.paused) {
    //   console.log("starting timer", timer);
    //   worker.postMessage({ command: "start", newDuration: timer.remaining });
    //   startTimer();
    // } else if (timer.running) {
    //   console.log("pausing timer", timer);
    //   worker.postMessage({ command: "pause" });
    //   pauseTimer();
    // } else if (timer.paused) {
    //   console.log("resuming timer", timer);
    //   worker.postMessage({ command: "resume" });
    //   resumeTimer();
    // }
  };

  return (
    <div>
      <div className="mx-auto max-w-xl p-1 py-4 flex items-center space-x-2">
        <RadioGroup
          value={timer.activeStage as unknown as string}
          onValueChange={(e) => {
            changeStage(e as unknown as PomodoroStage);
          }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            PomodoroStage.WorkTime,
            PomodoroStage.ShortBreak,
            PomodoroStage.LongBreak,
          ].map((option) => (
            <div key={option}>
              <RadioGroupItem
                id={option.toString()}
                value={option.toString()}
                className="peer sr-only"
              />
              <Label
                htmlFor={option.toString()}
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border border-muted bg-popover p-4 hover:bg-background/60 hover:text-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                  {
                    "border-primary": timer.activeStage === option,
                  }
                )}
              >
                {PomodoroStageMap[option as PomodoroStage]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="mx-auto sm:px-6 lg:px-8 py-4">
        <div className="flex justify-center gap-x-4 sm:gap-x-8">
          <div className="flex items-center justify-center text-center gap-x-2">
            <FlipClockPiece interval={minutesTens} />
            <FlipClockPiece interval={minutesUnit} />
          </div>
          <div className="flex items-center justify-center text-center gap-x-2">
            <FlipClockPiece interval={secondsTens} />
            <FlipClockPiece interval={secondsUnit} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl p-1 py-4 flex items-center space-x-2">
        <Button className="px-8" size="lg" fullWidth onClick={handleStartTimer}>
          {timer.paused ? "Resume" : timer.running ? "Pause" : "Start"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => nextStage()}
          disabled={timer.running || (!timer.running && !timer.paused)}
        >
          Next
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => setShowSettingsDialog(true)}
        >
          <Icons.settings className="w-4 h-4" />
        </Button>
      </div>

      {/* <div className="mx-auto max-w-2xl sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center text-center gap-x-2 transform scale-75 self-baseline">
          <FlipClockPiece
            interval={timer.sessionCount === 0 ? null : timer.sessionCount}
          />
        </div>
        <div className="flex gap-x-4">
          <div className="flex items-center gap-x-4">
            <Switch
              checked={timer.autoStartBreaks}
              onCheckedChange={() => toggleAutoStartBreaks()}
            />
            {timer.autoStartBreaks
              ? "Auto Start (Enabled)"
              : "Auto Start (Disabled)"}
          </div>
        </div>
      </div> */}

      <PomodoroSettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </div>
  );
};
