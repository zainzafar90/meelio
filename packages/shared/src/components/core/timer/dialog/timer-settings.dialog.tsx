import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { PomodoroStage } from "../../../../types/pomodoro";
import { usePomodoroStore } from "../../../../stores/unified-pomodoro.store";
import {
  MINUTE_IN_SECONDS,
  POMODORO_MAX_MINUTES,
} from "../../../../utils/common.utils";

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
    stageDurations,
    autoStartTimers,
    enableSound,
    resetTimer,
    toggleAutoStartBreaks,
    toggleTimerSound,
    changeTimerSettings,
  } = usePomodoroStore();
  const { t } = useTranslation();

  const form = useForm<TimerSettingsValues>({
    resolver: zodResolver(timerSettingsSchema as any),
    defaultValues: {
      workTime: stageDurations[PomodoroStage.Focus] / 60,
      shortBreak: stageDurations[PomodoroStage.Break] / 60,
    },
  });

  const handleSave = (data: TimerSettingsValues) => {
    changeTimerSettings(PomodoroStage.Focus, data.workTime);
    changeTimerSettings(PomodoroStage.Break, data.shortBreak);

    toast.success(t("timer.settings.toast.success"), {
      description: t("timer.settings.toast.description"),
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
          <DialogTitle>{t("timer.settings.title")}</DialogTitle>
          <DialogDescription>
            {t("timer.settings.description")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSave)}
          className="flex flex-col space-y-8"
        >
          <div className="border-t border-foreground/5 pt-4">
            <h3 className="text-base font-semibold leading-6 text-foreground">
              {t("timer.settings.timer.title")}
            </h3>
            <p className="mt-1 text-sm text-foreground/70">
              {t("timer.settings.timer.description")}
            </p>
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1">
              <label
                htmlFor="pomodoro"
                className="block text-sm font-medium leading-6 text-foreground"
              >
                {t("timer.settings.pomodoro.label")}
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
                {t("timer.settings.pomodoro.shortBreak")}
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
          </div>
          <div className="flex items-center justify-between space-x-4">
            <Label htmlFor="functional" className="flex flex-col space-y-1">
              <span className="text-md">
                {t("timer.settings.autoStart.label")}
              </span>
              <span className="text-sm font-normal leading-snug text-foreground/70">
                {t("timer.settings.autoStart.description")}
              </span>
            </Label>
            <Switch
              id="auto-start-break"
              checked={autoStartTimers}
              onCheckedChange={() => toggleAutoStartBreaks()}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <Label htmlFor="functional" className="flex flex-col space-y-1">
              <span className="text-md">{t("timer.settings.sound.label")}</span>
              <span className="text-sm font-normal leading-snug text-foreground/70">
                {t("timer.settings.sound.description")}
              </span>
            </Label>
            <Switch
              id="enable-timer-sound"
              checked={enableSound}
              onCheckedChange={() => toggleTimerSound()}
            />
          </div>

          <div className="flex items-start justify-between space-x-4">
            <Label htmlFor="functional" className="flex flex-col space-y-1">
              <span className="text-md">{t("timer.settings.reset.label")}</span>
              <span className="text-sm font-normal leading-snug text-foreground/70">
                {t("timer.settings.reset.description")}
              </span>
            </Label>
            <ResetTimerDialog onReset={resetTimer} />
          </div>
          <DialogFooter className="mt-4 flex gap-2 border-t border-t-zinc-100 pt-4 dark:border-t-zinc-900 sm:gap-1">
            <Button type="button" variant="secondary" onClick={() => onClose()}>
              {t("common.actions.close")}
            </Button>
            <Button type="submit">{t("common.actions.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
