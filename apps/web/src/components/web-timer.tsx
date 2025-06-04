import { useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PomodoroStage, formatTime, Icons, TimerStatsDialog, useDisclosure, ConditionalFeature, TimerPlaceholder, NextPinnedTask, useSettingsStore, usePomodoroTimer } from "@repo/shared";

import { Crown } from "lucide-react";

import TimerWorker from '../workers/timer-worker?worker';
import { useShallow } from "zustand/shallow";

export const WebTimer = () => {
  const workerRef = useRef<Worker>();
  const { t } = useTranslation();
  const { isOpen: isStatsDialogOpen, toggle: toggleStatsDialog } = useDisclosure();
  const { openSettings, setTab } = useSettingsStore(useShallow((state) => ({
    openSettings: state.openSettings,
    setTab: state.setTab,
  })));
  const {
    activeStage,
    isRunning,
    remaining,
    hasStarted,
    isLoading,
    stageDurations,
    dailyLimitStatus,
    handleStart,
    handlePause,
    handleResume,
    handleReset,
    handleSwitch,
    handleSkipToNextStage,
  } = usePomodoroTimer({
    send: (message) => workerRef.current?.postMessage(message),
    addListener: (handler) => {
      workerRef.current = new TimerWorker();
      workerRef.current.onmessage = (e: MessageEvent) => handler(e.data);
      return () => workerRef.current?.terminate();
    },
  });

  return (
    <div className="relative">
       <ConditionalFeature
          showFallback={dailyLimitStatus.isLimitReached}
          fallback={
            <TimerPlaceholder activeStage={activeStage} />
          }
          key={`timer-${stageDurations[activeStage]}-${activeStage}`}
        >
          <div className="max-w-full w-72 sm:w-[400px] backdrop-blur-xl bg-white/5 rounded-3xl shadow-lg text-white">
            <div className="p-6 space-y-10">
              {/* Timer Mode Tabs */}
              <div className="w-full">
                <div className="w-full h-12 rounded-full bg-gray-100/10 text-black p-1 flex">
                  <button
                    onClick={() => {
                      if (dailyLimitStatus.isLimitReached) {
                        return;
                      }
                      handleSwitch();
                    }}
                    disabled={dailyLimitStatus.isLimitReached}
                    className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                      activeStage === PomodoroStage.Focus ? 'bg-white/50' : ''
                    } ${
                      dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.focusMode")}
                  >
                    <span>Focus</span>
                  </button>
                  <button
                    onClick={() => {
                      if (dailyLimitStatus.isLimitReached) {
                        return;
                      }
                      handleSwitch();
                    }}
                    disabled={dailyLimitStatus.isLimitReached}
                    className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                      activeStage === PomodoroStage.Break ? 'bg-white/50' : ''
                    } ${
                      dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.breakMode")}
                  >
                    <span>Break</span>
                  </button>
                </div>
              </div>

              {/* Timer Display */}
              <div className="text-center space-y-4">
                <div className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-normal">
                  {isLoading ? <TimeSkeleton /> : formatTime(remaining)}
                </div>
                <NextPinnedTask />
              </div>

              <div className="flex flex-col gap-4">
                {/* Control Buttons */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    className={`cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm ${
                      dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (dailyLimitStatus.isLimitReached) {
                        return;
                      }
                      handleReset();
                    }}
                    disabled={dailyLimitStatus.isLimitReached}
                    title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.reset")}
                    role="button"
                  >
                    <Icons.resetTimer className="size-4 text-white/90" />
                    <span className="sr-only">{t("timer.controls.reset")}</span>
                  </button>

                  <button
                    className={`cursor-pointer relative flex h-10 w-full items-center justify-center rounded-full shadow-lg bg-gradient-to-b from-zinc-800 to-zinc-900 text-white/90 backdrop-blur-sm ${
                      dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (dailyLimitStatus.isLimitReached) {
                        return;
                      }
                      
                      if (isRunning) {
                        handlePause();
                      } else if (hasStarted) {
                        handleResume();
                      } else {
                        handleStart();
                      }
                    }}
                    disabled={dailyLimitStatus.isLimitReached}
                    title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.startStop")}
                    role="button"
                  >
                    {dailyLimitStatus.isLimitReached ? (
                      <>
                        <Crown className="size-4" />
                        <span className="ml-2 uppercase text-xs sm:text-sm md:text-base">Upgrade</span>
                      </>
                    ) : (
                      <>
                        {isRunning ? <Icons.pause className="size-4" /> : <Icons.play className="size-4" />}
                        <span className="ml-2 uppercase text-xs sm:text-sm md:text-base">
                          {isRunning ? t('common.actions.stop') : hasStarted ? 'Resume' : t('common.actions.start')}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    className={`cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm ${
                      dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (dailyLimitStatus.isLimitReached) {
                        return;
                      }
                      handleSkipToNextStage();
                    }}
                    disabled={dailyLimitStatus.isLimitReached}
                    title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.skipStage")}
                    role="button"
                  >
                    <Icons.forward className="size-4 text-white/90" />
                    <span className="sr-only">{t("timer.controls.skipStage")}</span>
                  </button>

                  <button
                    className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                    onClick={toggleStatsDialog}
                    title={t("timer.stats.title")}
                    role="button"
                  >
                    <Icons.graph className="size-4 text-white/90" />
                    <span className="sr-only">{t("timer.stats.title")}</span>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-gray-200/20 rounded-full">
                  <div
                    className="h-full bg-gray-100 rounded-full transition-all"
                    style={{
                      width: `${(remaining / stageDurations[activeStage]) * 100}%`
                    }}
                    role="progressbar"
                    aria-valuenow={(remaining / stageDurations[activeStage]) * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </div>
          </div>
        </ConditionalFeature>

      <TimerStatsDialog
        isOpen={isStatsDialogOpen}
        onOpenChange={toggleStatsDialog}
        onSettingsClick={() => {
          toggleStatsDialog();
          setTab("timer");
          openSettings();
        }}
      />
    </div>
  );
};

function TimeSkeleton() {
  return (
    <motion.div
      className="flex items-center justify-center gap-2"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      {/* Hours */}
      <div className="h-12 w-12 sm:w-[72px] sm:h-[72px] md:w-32 md:h-32 bg-white/80 rounded-lg backdrop-blur-sm" />

      {/* Colon */}
      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-1.5 sm:w-4 sm:h-4 bg-white/80 rounded-full backdrop-blur-sm" />
        <div className="h-1.5 w-1.5 sm:w-4 sm:h-4 bg-white/80 rounded-full backdrop-blur-sm" />
      </div>

      {/* Minutes */}
      <div className="h-12 w-12 sm:w-[72px] sm:h-[72px] md:w-32 md:h-32 bg-white/80 rounded-lg backdrop-blur-sm" />
    </motion.div>
  )
}