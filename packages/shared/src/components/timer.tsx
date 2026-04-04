import { useEffect } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { useShallow } from "zustand/shallow";
import { toast } from "sonner";
import { useDocumentTitle, useDisclosure } from "../hooks";
import { useTranslation } from "../i18n";
import {
  TimerStage,
  TimerEvent,
  TimerDurations,
  TimerRuntimeAdapter,
  TimerState,
} from "../types/timer.types";
import { formatTime } from "../utils/timer.utils";
import { Icons } from "./icons";
import { NextPinnedTask } from "./core/timer/components/timer-next-task";
import { TimerStatsDialog } from "./core/timer/dialog/timer-stats.dialog";
import { TimerSettingsDialog } from "./timer-settings.dialog";

const useRestoreTimer = (restore: () => void) => {
  useEffect(() => {
    restore();
  }, [restore]);
};

const useBackgroundMessages = (
  runtime: TimerRuntimeAdapter,
  stage: TimerStage,
  durations: TimerDurations,
  updateRemaining: (n: number) => void,
  completeStage: () => void,
  start: () => void,
  autoStartBreaks: boolean
) => {
  useEffect(() => {
    const unsubscribe = runtime.subscribe((msg: TimerEvent) => {
      switch (msg.type) {
        case "TICK":
          updateRemaining(msg.remaining);
          break;
        case "STAGE_COMPLETE":
          completeStage();
          if (autoStartBreaks) start();
          break;
        case "PAUSED":
          updateRemaining(msg.remaining);
          break;
        case "RESET_COMPLETE":
          updateRemaining(durations[stage]);
          break;
      }
    });

    return unsubscribe;
  }, [runtime, stage, durations, updateRemaining, completeStage, start, autoStartBreaks]);
};

interface TimerViewProps {
  remaining: number;
  running: boolean;
  stage: TimerStage;
  durations: TimerDurations;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: (s: TimerStage) => void;
  onStatsClick: () => void;
  onSettingsClick: () => void;
}

const TimerView = ({
  remaining,
  running,
  stage,
  durations,
  start,
  pause,
  reset,
  skip,
  onStatsClick,
  onSettingsClick,
}: TimerViewProps) => {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <div className="max-w-full w-88 rounded-[32px] border border-white/12 bg-black/48 text-white shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:w-[440px] lg:w-[540px]">
        <div className="space-y-10 p-4 sm:p-8">
          <div className="w-full">
            <div className="flex h-12 w-full rounded-full bg-black/45 p-1 text-white">
              <button
                onClick={() => skip(TimerStage.Focus)}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                  stage === TimerStage.Focus
                    ? "bg-white/88 text-black shadow-lg"
                    : "text-white/78 hover:bg-white/10"
                }`}
                title={t("timer.controls.focusMode")}
              >
                <span>{t("timer.controls.focusLabel")}</span>
              </button>
              <button
                onClick={() => skip(TimerStage.Break)}
                disabled={stage === TimerStage.Break}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                  stage === TimerStage.Break
                    ? "bg-white/88 text-black shadow-lg"
                    : "text-white/78 hover:bg-white/10"
                } ${stage === TimerStage.Break ? "cursor-not-allowed" : ""}`}
                title={t("timer.controls.breakMode")}
              >
                <span>{t("timer.controls.breakLabel")}</span>
              </button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="text-5xl font-bold tracking-normal sm:text-7xl md:text-9xl">
              {formatTime(remaining)}
            </div>
            <NextPinnedTask />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <button
                className="cursor-pointer relative flex size-10 shrink-0 items-center justify-center rounded-full bg-black/45 text-white"
                onClick={reset}
                title={t("timer.controls.reset")}
                role="button"
              >
                <Icons.resetTimer className="size-4 text-white" />
                <span className="sr-only">{t("timer.controls.resetLabel")}</span>
              </button>

              <button
                className="cursor-pointer relative flex size-10 shrink-0 items-center justify-center rounded-full bg-black/45 text-white"
                onClick={onStatsClick}
                title={t("timer.controls.viewStats")}
                role="button"
              >
                <Icons.graph className="size-4 text-white" />
                <span className="sr-only">{t("timer.controls.statsLabel")}</span>
              </button>

              <button
                className="cursor-pointer relative flex h-10 min-w-10 w-full items-center justify-center rounded-full bg-black text-white shadow-xl"
                onClick={() => running ? pause() : start()}
                title={running ? t("common.actions.pause") : t("common.actions.start")}
                role="button"
              >
                {running ? (
                  <Icons.pause className="size-4" />
                ) : (
                  <Icons.play className="size-4" />
                )}
                <span className="ml-2 uppercase text-xs sm:text-sm md:text-base hidden sm:block">
                  {running ? t("common.actions.pause") : t("common.actions.start")}
                </span>
              </button>

              <button
                className="cursor-pointer relative flex size-10 shrink-0 items-center justify-center rounded-full bg-black/45 text-white"
                onClick={() => skip(stage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus)}
                title={t("timer.controls.skipToNextStage")}
                role="button"
              >
                <Icons.forward className="size-4 text-white" />
                <span className="sr-only">{t("timer.controls.skipStage")}</span>
              </button>

              <button
                className="cursor-pointer relative flex size-10 shrink-0 items-center justify-center rounded-full bg-black/45 text-white"
                onClick={onSettingsClick}
                title={t("timer.controls.settings")}
                role="button"
              >
                <Icons.settings className="size-4 text-white" />
                <span className="sr-only">{t("timer.controls.settings")}</span>
              </button>
            </div>

            <div className="h-1.5 rounded-full bg-white/18">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${(remaining / durations[stage]) * 100}%` }}
                role="progressbar"
                aria-valuenow={(remaining / durations[stage]) * 100}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type TimerStoreHook = UseBoundStore<StoreApi<TimerState>>;

const useTimerState = (
  timerStore: TimerStoreHook,
  runtime: TimerRuntimeAdapter
) => {
  const { t } = useTranslation();
  const statsModal = useDisclosure();
  const settingsModal = useDisclosure();

  const store = timerStore(
    useShallow((state) => ({
      stage: state.stage,
      isRunning: state.isRunning,
      durations: state.durations,
      settings: state.settings,
      start: state.start,
      pause: state.pause,
      reset: state.reset,
      skipToStage: state.skipToStage,
      updateDurations: state.updateDurations,
      toggleNotifications: state.toggleNotifications,
      toggleSounds: state.toggleSounds,
      toggleSoundscapes: state.toggleSoundscapes,
      toggleAutoStartBreaks: state.toggleAutoStartBreaks,
      setSoundId: state.setSoundId,
      updateRemaining: state.updateRemaining,
      restore: state.restore,
      completeStage: state.completeStage,
      checkDailyReset: state.checkDailyReset,
    }))
  );

  const remaining = timerStore(
    useShallow((s) => {
      if (!s.isRunning && s.prevRemaining !== null) {
        return s.prevRemaining;
      }
      if (s.endTimestamp) {
        return Math.max(0, Math.ceil((s.endTimestamp - Date.now()) / 1000));
      }
      return s.durations[s.stage];
    })
  );

  useRestoreTimer(store.restore);
  useDocumentTitle({ remaining, stage: store.stage, running: store.isRunning });
  useBackgroundMessages(
    runtime,
    store.stage,
    store.durations,
    store.updateRemaining,
    store.completeStage,
    store.start,
    store.settings.autoStartBreaks ?? true
  );

  useEffect(() => {
    store.checkDailyReset?.();
  }, []);

  const handleSettingsChange = async (settings: {
    durations: { focusMin: number; breakMin: number };
    notifications: boolean;
    sounds: boolean;
    soundId?: string;
    soundscapes?: boolean;
    autoStartBreaks?: boolean;
  }) => {
    store.updateDurations({
      focus: settings.durations.focusMin * 60,
      break: settings.durations.breakMin * 60
    });

    if (settings.notifications !== store.settings.notifications) {
      if (settings.notifications) {
        const granted =
          (await runtime.requestNotificationPermission?.()) ?? true;

        if (!granted) {
          toast.error(t("timer.settings.notifications.denied"));
        } else {
          store.toggleNotifications();
        }
      } else {
        store.toggleNotifications();
      }
    }
    if (settings.sounds !== store.settings.sounds) {
      store.toggleSounds();
    }
    if (settings.soundId !== undefined && settings.soundId !== store.settings.soundId) {
      store.setSoundId?.(settings.soundId);
    }
    if (typeof settings.soundscapes === 'boolean' && settings.soundscapes !== store.settings.soundscapes) {
      store.toggleSoundscapes?.();
    }
    if (typeof settings.autoStartBreaks === 'boolean' && settings.autoStartBreaks !== (store.settings.autoStartBreaks ?? true)) {
      store.toggleAutoStartBreaks?.();
    }
  };

  return {
    store,
    remaining,
    handleSettingsChange,
    statsModal,
    settingsModal,
    notifications: store.settings.notifications,
    sounds: store.settings.sounds,
    soundId: store.settings.soundId ?? "timeout-1-back-chime",
    soundscapes: store.settings.soundscapes ?? true,
    autoStartBreaks: store.settings.autoStartBreaks ?? true,
  };
};

interface TimerProps {
  timerStore: TimerStoreHook;
  runtime: TimerRuntimeAdapter;
}

export const Timer = ({ timerStore, runtime }: TimerProps) => {
  const {
    store,
    remaining,
    handleSettingsChange,
    statsModal,
    settingsModal,
    notifications,
    sounds,
    soundId,
    soundscapes,
    autoStartBreaks,
  } = useTimerState(timerStore, runtime);

  return (
    <>
      <TimerView
        remaining={remaining}
        running={store.isRunning}
        stage={store.stage}
        durations={store.durations}
        start={store.start}
        pause={store.pause}
        reset={store.reset}
        skip={store.skipToStage}
        onStatsClick={statsModal.open}
        onSettingsClick={settingsModal.open}
      />

      <TimerStatsDialog
        isOpen={statsModal.isOpen}
        onOpenChange={(open) => (open ? statsModal.open() : statsModal.close())}
      />

      <TimerSettingsDialog
        isOpen={settingsModal.isOpen}
        onOpenChange={(open) => (open ? settingsModal.open() : settingsModal.close())}
        focusMin={store.durations[TimerStage.Focus] / 60}
        breakMin={store.durations[TimerStage.Break] / 60}
        notifications={notifications}
        sounds={sounds}
        soundId={soundId}
        soundscapes={soundscapes}
        autoStartBreaks={autoStartBreaks}
        onSave={handleSettingsChange}
      />
    </>
  );
};
