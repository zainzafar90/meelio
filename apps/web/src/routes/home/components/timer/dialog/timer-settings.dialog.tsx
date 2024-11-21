import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { PomodoroStage } from "@/types/pomodoro";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePomodoroSync } from "@/hooks/use-pomodoro-sync";
import { usePomodoroStore } from "@/stores/pomodoro.store";
import { MINUTE_IN_SECONDS, POMODORO_MAX_MINUTES } from "@/utils/common.utils";

import { ResetTimerDialog } from "./reset-timer.dialog";

const timerSettingsSchema = z.object({
  workTime: z.number().min(0).max(POMODORO_MAX_MINUTES),
  shortBreak: z.number().min(0).max(POMODORO_MAX_MINUTES),
  longBreak: z.number().min(0).max(POMODORO_MAX_MINUTES),
});

type TimerSettingsValues = z.infer<typeof timerSettingsSchema>;

export const TimerSettingsDialog = ({
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
  } = usePomodoroStore();
  const { broadcastDurationChange } = usePomodoroSync();

  const { stageSeconds } = timer;

  const form = useForm<TimerSettingsValues>({
    resolver: zodResolver(timerSettingsSchema),
    defaultValues: {
      workTime: stageSeconds[PomodoroStage.WorkTime] / MINUTE_IN_SECONDS,
      shortBreak: stageSeconds[PomodoroStage.ShortBreak] / MINUTE_IN_SECONDS,
      longBreak: stageSeconds[PomodoroStage.LongBreak] / MINUTE_IN_SECONDS,
    },
  });

  const handleSave = (data: TimerSettingsValues) => {
    changeTimerSettings(PomodoroStage.WorkTime, data.workTime);
    changeTimerSettings(PomodoroStage.ShortBreak, data.shortBreak);
    changeTimerSettings(PomodoroStage.LongBreak, data.longBreak);

    // Broadcast duration changes to other tabs
    broadcastDurationChange(data.workTime * MINUTE_IN_SECONDS);
    broadcastDurationChange(data.shortBreak * MINUTE_IN_SECONDS);
    broadcastDurationChange(data.longBreak * MINUTE_IN_SECONDS);

    toast.success("Settings saved", {
      description: "Your settings have been saved.",
    });
    onClose();
  };

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
          <DialogDescription>Configure the timer settings</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSave)}
          className="flex flex-col space-y-8"
        >
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
                htmlFor="pomodoro"
                className="block text-sm font-medium leading-6 text-foreground"
              >
                Pomodoro
              </label>
              <div className="mt-2">
                <Controller
                  name="workTime"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      min={0}
                      max={POMODORO_MAX_MINUTES}
                      type="number"
                      id="pomodoro"
                      autoCorrect="off"
                      autoCapitalize="none"
                      autoComplete="pomodoro"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex-1">
              <label
                htmlFor="short-break"
                className="block text-sm font-medium leading-6 text-foreground"
              >
                Short Break
              </label>
              <div className="mt-2">
                <Controller
                  name="shortBreak"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      min={0}
                      max={POMODORO_MAX_MINUTES}
                      type="number"
                      id="short-break"
                      autoCorrect="off"
                      autoCapitalize="none"
                      autoComplete="short-break"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex-1">
              <label
                htmlFor="long-break"
                className="block text-sm font-medium leading-6 text-foreground"
              >
                Long Break
              </label>
              <div className="mt-2">
                <Controller
                  name="longBreak"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      min={0}
                      max={POMODORO_MAX_MINUTES}
                      type="number"
                      id="long-break"
                      autoCorrect="off"
                      autoCapitalize="none"
                      autoComplete="long-break"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <Label htmlFor="functional" className="flex flex-col space-y-1">
              <span className="text-md">Auto Start Breaks</span>
              <span className="text-sm font-normal leading-snug text-foreground/70">
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
              <span className="text-sm font-normal leading-snug text-foreground/70">
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
              <span className="text-sm font-normal leading-snug text-foreground/70">
                Are you sure you want to reset the timer? This will reset the
                timer to the default settings.
              </span>
            </Label>
            <ResetTimerDialog onReset={resetTimer} />
          </div>
          <DialogFooter className="mt-4 flex gap-2 border-t border-t-zinc-100 pt-4 dark:border-t-zinc-900 sm:gap-1">
            <Button type="button" variant="secondary" onClick={() => onClose()}>
              Close
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
