import { PomodoroStage } from "@/types/pomodoro";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMeelioStore } from "@/store/meelio.store";
import { MINUTE_IN_SECONDS, POMODORO_MAX_MINUTES } from "@/utils/common.utils";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

export const PomodoroSettingsDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    timer,
    resetTimer,
    toggleAutoStartBreaks,
    toggleTimerSound,
    changeTimerSettings,
  } = useMeelioStore((state) => state);

  const { stageSeconds } = timer;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-8">
          <div className="border-t border-foreground/5 pt-4">
            <h3 className="text-base font-semibold leading-6 text-foreground">
              Timer
            </h3>
            <p className="mt-1 text-sm text-foreground/70">
              Configure the timer settings in minutes, recommended values are
              between 1 and 60 minutes.
            </p>
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1">
              <label
                htmlFor="street-address"
                className="block text-sm font-medium leading-6 text-foreground"
              >
                Pomodoro
              </label>
              <div className="mt-2">
                <Input
                  min={0}
                  max={POMODORO_MAX_MINUTES}
                  type="number"
                  id="pomodoro"
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="pomodoro"
                  value={
                    stageSeconds[PomodoroStage.WorkTime] / MINUTE_IN_SECONDS
                  }
                  onChange={(e) => {
                    const value = +e.target.value;
                    if (value >= 0 && value <= POMODORO_MAX_MINUTES) {
                      changeTimerSettings(PomodoroStage.WorkTime, value);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <label
                htmlFor="street-address"
                className="block text-sm font-medium leading-6 text-foreground"
              >
                Short Break
              </label>
              <div className="mt-2">
                <Input
                  min={0}
                  max={POMODORO_MAX_MINUTES}
                  type="number"
                  id="short-break"
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="short-break"
                  value={
                    stageSeconds[PomodoroStage.ShortBreak] / MINUTE_IN_SECONDS
                  }
                  onChange={(e) => {
                    const value = +e.target.value;
                    if (value >= 0 && value <= POMODORO_MAX_MINUTES) {
                      changeTimerSettings(PomodoroStage.ShortBreak, value);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <label
                htmlFor="street-address"
                className="block text-sm font-medium leading-6 text-foreground"
              >
                Long Break
              </label>
              <div className="mt-2">
                <Input
                  min={0}
                  max={POMODORO_MAX_MINUTES}
                  type="number"
                  id="long-break"
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="long-break"
                  value={
                    stageSeconds[PomodoroStage.LongBreak] / MINUTE_IN_SECONDS
                  }
                  onChange={(e) => {
                    const value = +e.target.value;

                    if (value >= 0 && value <= POMODORO_MAX_MINUTES) {
                      changeTimerSettings(PomodoroStage.LongBreak, value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <Label htmlFor="functional" className="flex flex-col space-y-1">
              <span className="text-md">Auto Start Breaks</span>
              <span className="font-normal text-sm leading-snug text-foreground/70">
                Start breaks after work sessions, i.e. after 25 minutes of work
                time automatically start a 5 minute break.
              </span>
            </Label>
            <Switch
              id="auto-start-break"
              checked={timer.autoStartBreaks}
              onCheckedChange={() => toggleAutoStartBreaks()}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <Label htmlFor="functional" className="flex flex-col space-y-1">
              <span className="text-md">Enable Sounds</span>
              <span className="font-normal text-sm leading-snug text-foreground/70">
                Play sounds when the timer ends, and when breaks start.
              </span>
            </Label>
            <Switch
              id="enable-timer-sound"
              checked={timer.enableSound}
              onCheckedChange={() => toggleTimerSound()}
            />
          </div>

          <div className="flex items-start justify-between space-x-4">
            <Label htmlFor="functional" className="flex flex-col space-y-1">
              <span className="text-md"> Reset Pomodoro Timer</span>
              <span className="font-normal text-sm leading-snug text-foreground/70">
                Are you sure you want to reset the timer? This will reset the
                timer to the default settings.
              </span>
            </Label>
            <Button variant="destructive" onClick={() => resetTimer()}>
              Reset
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onClose()}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
