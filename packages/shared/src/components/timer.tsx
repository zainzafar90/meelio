import { useEffect } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { useShallow } from "zustand/shallow";
import { toast } from "sonner";
import { Brain, Coffee } from "lucide-react";
import { useDocumentTitle, useDisclosure } from "../hooks";
import { useTranslation } from "../i18n";
import { useZenModeStore } from "../stores/zen-mode.store";
import {
  TimerStage,
  TimerEvent,
  TimerDurations,
  TimerRuntimeAdapter,
  TimerState,
} from "../types/timer.types";
import { formatTime } from "../utils/timer.utils";
import { Icons } from "./icons";
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
    <div className="relative w-full">
      <div className="relative mx-auto w-[22rem] max-w-full overflow-hidden rounded-[30px] bg-white/10 text-white shadow-[0_24px_70px_rgba(0,0,0,0.20)] backdrop-blur-[28px] sm:w-[440px] lg:w-[520px]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_28%,rgba(0,0,0,0.08))]" />
        <div className="space-y-3 p-4 [@media(min-height:580px)]:space-y-5 sm:space-y-8 sm:p-7">
          <div className="w-full">
            <div className="flex h-12 w-full rounded-full bg-white/12 p-1 text-white backdrop-blur-md">
              <button
                onClick={() => skip(TimerStage.Focus)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors ${
                  stage === TimerStage.Focus
                    ? "bg-white text-zinc-950 shadow-lg"
                    : "text-white/78 hover:bg-white/10"
                }`}
                title={t("timer.controls.focusMode")}
              >
                <Brain className="size-4 sm:hidden" />
                <span className="hidden sm:inline">{t("timer.controls.focusLabel")}</span>
              </button>
              <button
                onClick={() => skip(TimerStage.Break)}
                disabled={stage === TimerStage.Break}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors ${
                  stage === TimerStage.Break
                    ? "bg-white text-zinc-950 shadow-lg"
                    : "text-white/78 hover:bg-white/10"
                } ${stage === TimerStage.Break ? "cursor-not-allowed" : ""}`}
                title={t("timer.controls.breakMode")}
              >
                <Coffee className="size-4 sm:hidden" />
                <span className="hidden sm:inline">{t("timer.controls.breakLabel")}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div className="text-5xl font-bold tracking-normal sm:text-7xl md:text-9xl">
              {formatTime(remaining)}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <button
                className="relative hidden sm:flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/14 text-white transition-colors backdrop-blur-sm hover:bg-white/20"
                onClick={reset}
                title={t("timer.controls.reset")}
                role="button"
              >
                <Icons.resetTimer className="size-4 text-white" />
                <span className="sr-only">{t("timer.controls.resetLabel")}</span>
              </button>

              <button
                className="relative hidden sm:flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/14 text-white transition-colors backdrop-blur-sm hover:bg-white/20"
                onClick={onStatsClick}
                title={t("timer.controls.viewStats")}
                role="button"
              >
                <Icons.graph className="size-4 text-white" />
                <span className="sr-only">{t("timer.controls.statsLabel")}</span>
              </button>

              <button
                className="relative flex h-10 min-w-10 w-full cursor-pointer items-center justify-center rounded-full bg-white text-zinc-950 shadow-xl transition-colors hover:bg-white/92"
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
                className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/14 text-white transition-colors backdrop-blur-sm hover:bg-white/20"
                onClick={() => skip(stage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus)}
                title={t("timer.controls.skipToNextStage")}
                role="button"
              >
                <Icons.forward className="size-4 text-white" />
                <span className="sr-only">{t("timer.controls.skipStage")}</span>
              </button>

              <button
                className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/14 text-white transition-colors backdrop-blur-sm hover:bg-white/20"
                onClick={onSettingsClick}
                title={t("timer.controls.settings")}
                role="button"
              >
                <Icons.settings className="size-4 text-white" />
                <span className="sr-only">{t("timer.controls.settings")}</span>
              </button>
            </div>

            <div className="h-1.5 rounded-full bg-white/14">
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

const ZenTimerView = ({
  remaining,
  running,
  stage,
  durations,
  start,
  pause,
  skip,
}: Pick<
  TimerViewProps,
  "remaining" | "running" | "stage" | "durations" | "start" | "pause" | "skip"
>) => {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="flex flex-col items-center gap-6">
        <div className="text-6xl font-bold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)] sm:text-8xl md:text-9xl">
          {formatTime(remaining)}
        </div>

        <div className="flex items-center gap-4">
          <button
            className="inline-flex size-10 items-center justify-center rounded-full text-white/40 transition-opacity duration-200 hover:text-white/90"
            onClick={() =>
              skip(
                stage === TimerStage.Focus
                  ? TimerStage.Break
                  : TimerStage.Focus,
              )
            }
            title={t("timer.controls.skipToNextStage")}
          >
            <Icons.forward className="size-4" />
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white/50 transition-opacity duration-200 hover:text-white/90"
            onClick={() => (running ? pause() : start())}
            title={
              running
                ? t("common.actions.pause")
                : t("common.actions.start")
            }
          >
            {running ? (
              <Icons.pause className="size-4" />
            ) : (
              <Icons.play className="size-4" />
            )}
            <span className="uppercase text-xs tracking-wider">
              {running
                ? t("common.actions.pause")
                : t("common.actions.start")}
            </span>
          </button>
        </div>

        <div className="mx-auto h-0.5 w-48 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white/30 transition-all"
            style={{
              width: `${(remaining / durations[stage]) * 100}%`,
            }}
            role="progressbar"
            aria-valuenow={(remaining / durations[stage]) * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          />
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
  const zenPhase = useZenModeStore(useShallow((state) => state.phase));
  const isZenActive = zenPhase !== "inactive";

  return (
    <>
      {isZenActive ? (
        <ZenTimerView
          remaining={remaining}
          running={store.isRunning}
          stage={store.stage}
          durations={store.durations}
          start={store.start}
          pause={store.pause}
          skip={store.skipToStage}
        />
      ) : (
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
      )}

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
