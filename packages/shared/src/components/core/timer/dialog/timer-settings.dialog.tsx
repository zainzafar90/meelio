import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/ui/button";
import { Volume2 } from "lucide-react";
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
import { POMODORO_MAX_MINUTES } from "../../../../utils/common.utils";

import { ResetTimerDialog } from "./reset-timer.dialog";
import { useAuthStore } from "../../../../stores/auth.store";
import { useAppStore } from "../../../../stores/app.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { pomodoroSounds } from "../../../../data/sounds-data";

const timerSettingsSchema = z.object({
  workTime: z.number().min(1).max(POMODORO_MAX_MINUTES),
  shortBreak: z.number().min(1).max(POMODORO_MAX_MINUTES),
  longBreak: z.number().min(1).max(POMODORO_MAX_MINUTES).optional(),
});

type TimerSettingsValues = z.infer<typeof timerSettingsSchema>;

export const TimerSettingsDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const isExtension = useAppStore.getState().platform === "extension";
  const {
    stageDurations,
    autoStartTimers,
    enableSound,
    notificationSoundId,
    notificationEnabled,
    notificationSoundEnabled,
    resetTimer,
    toggleAutoStartBreaks,
    toggleTimerSound,
    updateNotificationSoundId,
    updateNotificationEnabled,
    setNotificationSoundEnabled,
    changeTimerSettings,
    reinitializeTimer,
  } = usePomodoroStore();
  const { t } = useTranslation();

  const form = useForm<TimerSettingsValues>({
    resolver: zodResolver(timerSettingsSchema as any),
    defaultValues: {
      workTime: stageDurations[PomodoroStage.Focus] / 60,
      shortBreak: stageDurations[PomodoroStage.Break] / 60,
    },
  });

  const playPreviewSound = (soundId: string) => {
    try {
      const soundFile = `${soundId}.mp3`;
      const soundPath = isExtension
        ? chrome.runtime.getURL(`public/sounds/pomodoro/${soundFile}`)
        : `/sounds/pomodoro/${soundFile}`;

      const audio = new Audio(soundPath);
      audio.volume = 0.5;
      audio.play().catch((error) => {
        console.error("Failed to play preview sound:", error);
      });
    } catch (error) {
      console.error("Error playing preview sound:", error);
    }
  };

  const handleSave = async (data: TimerSettingsValues) => {
    try {
      if (useAuthStore.getState().user?.isPro) {
        await changeTimerSettings({
          workDuration: data.workTime,
          breakDuration: data.shortBreak,
          autoStart: autoStartTimers,
          soundOn: enableSound,
          notificationSoundId: notificationSoundId,
          notificationSoundEnabled: notificationSoundEnabled,
        });
      }

      reinitializeTimer();

      toast.success(t("timer.settings.toast.success"), {
        description: t("timer.settings.toast.description"),
      });
      onClose();
    } catch (error) {
      toast.error(t("timer.settings.toast.error"), {
        description: t("timer.settings.toast.errorDescription"),
      });
    }
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
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        min={1}
                        max={POMODORO_MAX_MINUTES}
                        type="number"
                        id="pomodoro"
                        autoCorrect="off"
                        autoCapitalize="none"
                        autoComplete="pomodoro"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 1)
                        }
                        className={fieldState.error ? "border-red-500" : ""}
                      />
                      {fieldState.error && (
                        <p className="text-sm text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
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
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        min={1}
                        max={POMODORO_MAX_MINUTES}
                        type="number"
                        id="short-break"
                        autoCorrect="off"
                        autoCapitalize="none"
                        autoComplete="short-break"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 1)
                        }
                        className={fieldState.error ? "border-red-500" : ""}
                      />
                      {fieldState.error && (
                        <p className="text-sm text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
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

          <div className="flex items-center justify-between space-x-4">
            <Label htmlFor="functional" className="flex flex-col space-y-1">
              <span className="text-md">Timer notification</span>
              <span className="text-sm font-normal leading-snug text-foreground/70">
                Show a notification when the timer completes
              </span>
            </Label>
            <Switch
              id="enable-timer-notification"
              checked={notificationEnabled}
              onCheckedChange={() =>
                updateNotificationEnabled(!notificationEnabled)
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <Label htmlFor="functional" className="flex flex-col space-y-1">
              <span className="text-md">Timer notification sound</span>
              <span className="text-sm font-normal leading-snug text-foreground/70">
                Play a sound when the timer completes
              </span>
            </Label>
            <Switch
              id="enable-timer-notification-sound"
              disabled={!notificationEnabled}
              checked={notificationSoundEnabled}
              onCheckedChange={() =>
                setNotificationSoundEnabled(!notificationSoundEnabled)
              }
            />
          </div>

          {notificationEnabled && (
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-4">
                <Label
                  htmlFor="sound-selector"
                  className="flex flex-col space-y-1"
                >
                  <span className="text-md">Timer Sound</span>
                  <span className="text-sm font-normal leading-snug text-foreground/70">
                    Choose the sound to play when timer completes
                  </span>
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={notificationSoundId}
                    onValueChange={(value) => updateNotificationSoundId(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a sound" />
                    </SelectTrigger>
                    <SelectContent>
                      {pomodoroSounds.map((sound) => (
                        <SelectItem key={sound.id} value={sound.id}>
                          {sound.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => playPreviewSound(notificationSoundId)}
                    title="Preview sound"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving..."
                : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
