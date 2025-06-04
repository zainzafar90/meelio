import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/ui/button";
import { Volume2 } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Switch } from "@repo/ui/components/ui/switch";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

import { PomodoroStage } from "../../../../types/pomodoro";
import { usePomodoroStore } from "../../../../stores/unified-pomodoro.store";
import { POMODORO_MAX_MINUTES } from "../../../../utils/common.utils";
import { ResetTimerDialog } from "../../timer/dialog/reset-timer.dialog";
import { useAuthStore } from "../../../../stores/auth.store";
import { useAppStore } from "../../../../stores/app.store";
import { pomodoroSounds } from "../../../../data/sounds-data";
import { useShallow } from "zustand/shallow";

const timerSettingsSchema = z.object({
  workTime: z.number().min(1).max(POMODORO_MAX_MINUTES),
  shortBreak: z.number().min(1).max(POMODORO_MAX_MINUTES),
  longBreak: z.number().min(1).max(POMODORO_MAX_MINUTES).optional(),
});

type TimerSettingsValues = z.infer<typeof timerSettingsSchema>;

export function TimerSettings() {
  const { t } = useTranslation();
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
  } = usePomodoroStore(
    useShallow((state) => ({
      stageDurations: state.stageDurations,
      autoStartTimers: state.autoStartTimers,
      enableSound: state.enableSound,
      notificationSoundId: state.notificationSoundId,
      notificationEnabled: state.notificationEnabled,
      notificationSoundEnabled: state.notificationSoundEnabled,
      resetTimer: state.resetTimer,
      toggleAutoStartBreaks: state.toggleAutoStartBreaks,
      toggleTimerSound: state.toggleTimerSound,
      updateNotificationSoundId: state.updateNotificationSoundId,
      updateNotificationEnabled: state.updateNotificationEnabled,
      setNotificationSoundEnabled: state.setNotificationSoundEnabled,
      changeTimerSettings: state.changeTimerSettings,
      reinitializeTimer: state.reinitializeTimer,
    }))
  );

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
    } catch (error) {
      toast.error(t("timer.settings.toast.error"), {
        description: t("timer.settings.toast.errorDescription"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={form.handleSubmit(handleSave)}
        className="flex flex-col space-y-6"
      >
        <p className="mt-1 text-sm text-foreground/70">
          {t("timer.settings.timer.description")}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label
              htmlFor="pomodoro"
              className="block text-sm font-medium leading-6 text-foreground mb-2"
            >
              {t("timer.settings.pomodoro.label")}
            </label>
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
          <div className="flex-1">
            <label
              htmlFor="short-break"
              className="block text-sm font-medium leading-6 text-foreground mb-2"
            >
              {t("timer.settings.pomodoro.shortBreak")}
            </label>
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

        <div
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
          onClick={() => toggleAutoStartBreaks()}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("timer.settings.autoStart.label")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("timer.settings.autoStart.description")}
            </p>
          </div>
          <Switch
            size="sm"
            checked={autoStartTimers}
            onCheckedChange={() => toggleAutoStartBreaks()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
          onClick={() => toggleTimerSound()}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("timer.settings.sound.label")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("timer.settings.sound.description")}
            </p>
          </div>
          <Switch
            size="sm"
            checked={enableSound}
            onCheckedChange={() => toggleTimerSound()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
          onClick={() => updateNotificationEnabled(!notificationEnabled)}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">Timer notification</p>
            <p className="text-sm text-muted-foreground">
              Show a notification when the timer completes
            </p>
          </div>
          <Switch
            size="sm"
            checked={notificationEnabled}
            onCheckedChange={() =>
              updateNotificationEnabled(!notificationEnabled)
            }
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
          onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">Timer notification sound</p>
            <p className="text-sm text-muted-foreground">
              Play a sound when the timer completes
            </p>
          </div>
          <Switch
            size="sm"
            disabled={!notificationEnabled}
            checked={notificationSoundEnabled}
            onCheckedChange={() =>
              setNotificationSoundEnabled(!notificationSoundEnabled)
            }
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {notificationEnabled && (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Timer Sound</p>
              <p className="text-sm text-muted-foreground">
                Choose the sound to play when timer completes
              </p>
            </div>
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
        )}

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("timer.settings.reset.label")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("timer.settings.reset.description")}
            </p>
          </div>
          <ResetTimerDialog onReset={resetTimer} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Saving..."
              : t("common.actions.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
