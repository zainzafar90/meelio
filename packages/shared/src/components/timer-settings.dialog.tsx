import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/ui/button";
import { Volume2 } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Switch } from "@repo/ui/components/ui/switch";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { useTranslation } from "../i18n";

import { pomodoroSounds } from "../data/sounds-data";
import { soundSyncService } from "../services/sound-sync.service";

type TimerSettingsValues = {
  focusTime: number;
  breakTime: number;
};

export interface TimerSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  focusMin: number;
  breakMin: number;
  notifications: boolean;
  sounds: boolean;
  soundId?: string;
  soundscapes?: boolean;
  autoStartBreaks?: boolean;
  onSave: (values: {
    durations: { focusMin: number; breakMin: number };
    notifications: boolean;
    sounds: boolean;
    soundId?: string;
    soundscapes?: boolean;
    autoStartBreaks?: boolean;
  }) => void | Promise<void>;
}

export function TimerSettingsDialog({
  isOpen,
  onOpenChange,
  focusMin,
  breakMin,
  notifications,
  sounds,
  soundId = "timeout-1-back-chime",
  soundscapes = true,
  autoStartBreaks = true,
  onSave,
}: TimerSettingsDialogProps) {
  const { t } = useTranslation();
  const timerSettingsSchema = z.object({
    focusTime: z
      .number({
        invalid_type_error: t("timer.validation.invalidNumber"),
      })
      .min(1, t("timer.validation.min", { count: 1 }))
      .max(1440, t("timer.validation.max", { count: 1440 })),
    breakTime: z
      .number({
        invalid_type_error: t("timer.validation.invalidNumber"),
      })
      .min(1, t("timer.validation.min", { count: 1 }))
      .max(1440, t("timer.validation.max", { count: 1440 })),
  });

  const form = useForm<TimerSettingsValues>({
    resolver: zodResolver(timerSettingsSchema),
    defaultValues: {
      focusTime: focusMin,
      breakTime: breakMin,
    },
  });

  const playPreviewSound = async (soundId: string) => {
    try {
        const sound = pomodoroSounds.find((s) => s.id === soundId);
        if (!sound) {
        console.error("Sound not found:", soundId);
        return;
      }

      const url = await soundSyncService.getSoundUrl(sound.url);
      const audio = new Audio(url);
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
      await onSave({
        durations: {
          focusMin: data.focusTime,
          breakMin: data.breakTime,
        },
        notifications,
        sounds,
        soundId,
        soundscapes,
        autoStartBreaks,
      });

      onOpenChange(false);

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
    void onSave({
      durations: { focusMin, breakMin },
      notifications: !notifications,
      sounds,
      soundId,
      soundscapes,
      autoStartBreaks,
    });
  };

  const handleSoundsToggle = () => {
    void onSave({
      durations: { focusMin, breakMin },
      notifications,
      sounds: !sounds,
      soundId,
      soundscapes,
      autoStartBreaks,
    });
  };

  const handleSoundChange = (newSoundId: string) => {
    void onSave({
      durations: { focusMin, breakMin },
      notifications,
      sounds,
      soundId: newSoundId,
      soundscapes,
      autoStartBreaks,
    });
  };

  const handleSoundscapesToggle = () => {
    void onSave({
      durations: { focusMin, breakMin },
      notifications,
      sounds,
      soundId,
      soundscapes: !soundscapes,
      autoStartBreaks,
    });
  };

  const handleAutoStartBreaksToggle = () => {
    void onSave({
      durations: { focusMin, breakMin },
      notifications,
      sounds,
      soundId,
      soundscapes,
      autoStartBreaks: !autoStartBreaks,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("timer.settings.title")}</DialogTitle>
          <DialogDescription>
            {t("timer.settings.description")}
          </DialogDescription>
        </DialogHeader>
        
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
                        max={1440}
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
                        max={1440}
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
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {t("timer.settings.notifications.label")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("timer.settings.notifications.description")}
                </p>
              </div>
              <Switch
                size="sm"
                checked={notifications}
                onCheckedChange={handleNotificationsToggle}
              />
            </div>

            <div
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
              onClick={handleSoundsToggle}
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {t("timer.settings.notificationSound.label")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("timer.settings.notificationSound.description")}
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

            <div
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {t("timer.settings.soundscapes.label")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("timer.settings.soundscapes.description")}
                </p>
              </div>
              <Switch
                size="sm"
                checked={!!soundscapes}
                onCheckedChange={handleSoundscapesToggle}
              />
            </div>

            <div
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
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
                checked={!!autoStartBreaks}
                onCheckedChange={handleAutoStartBreaksToggle}
              />
            </div>

            {notifications && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t("timer.settings.soundPicker.label")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("timer.settings.soundPicker.description")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={soundId}
                    onValueChange={handleSoundChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue
                        placeholder={t("timer.settings.soundPicker.placeholder")}
                      />
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
                    onClick={() => playPreviewSound(soundId)}
                    title={t("timer.settings.soundPicker.preview")}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? t("timer.settings.actions.saving")
                  : t("common.actions.save")}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
