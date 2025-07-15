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

import { useShallow } from "zustand/shallow";
import { useAppStore } from "../stores/app.store";
import { pomodoroSounds } from "../data/sounds-data";

const timerSettingsSchema = z.object({
  focusTime: z.number().min(1).max(90),
  breakTime: z.number().min(1).max(30),
});

type TimerSettingsValues = z.infer<typeof timerSettingsSchema>;

export interface UnifiedTimerSettingsProps {
  focusMin: number;
  breakMin: number;
  notifications: boolean;
  sounds: boolean;
  onSave: (values: {
    durations: { focusMin: number; breakMin: number };
    notifications: boolean;
    sounds: boolean;
  }) => void;
  onCancel?: () => void;
}

export function UnifiedTimerSettings({
  focusMin,
  breakMin,
  notifications,
  sounds,
  onSave,
  onCancel,
}: UnifiedTimerSettingsProps) {
  const isExtension = useAppStore(useShallow((state) => state.platform === "extension"));
  const { t } = useTranslation();

  const form = useForm<TimerSettingsValues>({
    resolver: zodResolver(timerSettingsSchema),
    defaultValues: {
      focusTime: focusMin,
      breakTime: breakMin,
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
      onSave({
        durations: {
          focusMin: data.focusTime,
          breakMin: data.breakTime,
        },
        notifications,
        sounds,
      });

      toast.success(t("timer.settings.toast.success"), {
        description: t("timer.settings.toast.description"),
      });
    } catch (error) {
      toast.error(t("timer.settings.toast.error"), {
        description: t("timer.settings.toast.errorDescription"),
      });
    }
  };

  const handleNotificationsToggle = () => {
    onSave({
      durations: { focusMin, breakMin },
      notifications: !notifications,
      sounds,
    });
  };

  const handleSoundsToggle = () => {
    onSave({
      durations: { focusMin, breakMin },
      notifications,
      sounds: !sounds,
    });
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
              htmlFor="focus-time"
              className="block text-sm font-medium leading-6 text-foreground mb-2"
            >
              {t("timer.settings.pomodoro.label")}
            </label>
            <Controller
              name="focusTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    min={1}
                    max={90}
                    type="number"
                    id="focus-time"
                    autoCorrect="off"
                    autoCapitalize="none"
                    autoComplete="focus-time"
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
              htmlFor="break-time"
              className="block text-sm font-medium leading-6 text-foreground mb-2"
            >
              {t("timer.settings.pomodoro.shortBreak")}
            </label>
            <Controller
              name="breakTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    min={1}
                    max={30}
                    type="number"
                    id="break-time"
                    autoCorrect="off"
                    autoCapitalize="none"
                    autoComplete="break-time"
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
          onClick={handleNotificationsToggle}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">Timer notification</p>
            <p className="text-sm text-muted-foreground">
              Show a notification when the timer completes
            </p>
          </div>
          <Switch
            size="sm"
            checked={notifications}
            onCheckedChange={handleNotificationsToggle}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
          onClick={handleSoundsToggle}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">Timer notification sound</p>
            <p className="text-sm text-muted-foreground">
              Play a sound when the timer completes
            </p>
          </div>
          <Switch
            size="sm"
            disabled={!notifications}
            checked={sounds}
            onCheckedChange={handleSoundsToggle}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {notifications && (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Timer Sound</p>
              <p className="text-sm text-muted-foreground">
                Choose the sound to play when timer completes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value="timeout-1-back-chime"
                onValueChange={() => {}}
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
                onClick={() => playPreviewSound("timeout-1-back-chime")}
                title="Preview sound"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
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