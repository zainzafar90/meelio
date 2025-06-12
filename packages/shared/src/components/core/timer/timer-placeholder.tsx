import { Crown } from "lucide-react";
import { PomodoroStage } from "../../../types/pomodoro";
import { Icons } from "../../icons";
import { useTranslation } from "react-i18next";

interface TimerPlaceholderProps {
  activeStage: PomodoroStage;
  onUpgradeClick?: () => void;
}

export const TimerPlaceholder = ({
  activeStage,
  onUpgradeClick,
}: TimerPlaceholderProps) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-full w-72 sm:w-[400px] backdrop-blur-xl bg-white/5 rounded-3xl shadow-lg text-white">
      <div className="p-6 space-y-6">
        {/* Timer Mode Tabs */}
        <div className="w-full">
          <div className="w-full h-12 rounded-full bg-gray-100/10 text-black p-1 flex">
            <button
              disabled
              className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                activeStage === PomodoroStage.Focus ? "bg-white/50" : ""
              } opacity-50 cursor-not-allowed`}
              title={t("timer.limitReached.title")}
            >
              <span>Focus</span>
            </button>
            <button
              disabled
              className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                activeStage === PomodoroStage.Break ? "bg-white/50" : ""
              } opacity-50 cursor-not-allowed`}
              title={t("timer.limitReached.title")}
            >
              <span>Break</span>
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center space-y-4">
          <div className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-normal">
            <TimerSkeletonDisplay />
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <div className="text-sm text-white font-medium">
              {t("timer.limitReached.toast")}
            </div>
            <div className="text-xs text-white/80">
              Resets at midnight or upgrade to Pro
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Control Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              className="relative  hidden md:flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm opacity-50 cursor-not-allowed"
              disabled
              title={t("timer.limitReached.title")}
              role="button"
            >
              <Icons.resetTimer className="size-4 text-white/90" />
              <span className="sr-only">{t("timer.controls.reset")}</span>
            </button>

            <button
              className="cursor-pointer relative flex h-10 w-full items-center justify-center rounded-full shadow-lg bg-gradient-to-b from-amber-700 to-amber-900 text-white/90 backdrop-blur-sm"
              onClick={onUpgradeClick}
              title="Upgrade to Pro"
              role="button"
            >
              <Crown className="size-4" />
              <span className="ml-2 text-xs sm:text-sm md:text-base">
                Upgrade to Pro
              </span>
            </button>

            <button
              className="relative hidden md:flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm opacity-50 cursor-not-allowed"
              disabled
              title={t("timer.limitReached.title")}
              role="button"
            >
              <Icons.forward className="size-4 text-white/90" />
              <span className="sr-only">{t("timer.controls.skipStage")}</span>
            </button>

            <button
              className="relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm opacity-50 cursor-not-allowed"
              disabled
              title={t("timer.limitReached.title")}
              role="button"
            >
              <Icons.graph className="size-4 text-white/90" />
              <span className="sr-only">{t("timer.stats.title")}</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-200/20 rounded-full">
            <div
              className="h-full bg-gray-200/20 rounded-full transition-all w-full"
              role="progressbar"
              aria-valuenow={100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function TimerSkeletonDisplay() {
  return (
    <div className="flex items-center justify-center gap-2">
      {/* Hours */}
      <div className="h-12 w-12 sm:w-[72px] sm:h-[72px] md:w-32 md:h-32 bg-white/40 rounded-lg backdrop-blur-sm" />

      {/* Colon */}
      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-1.5 sm:w-4 sm:h-4 bg-white/40 rounded-full backdrop-blur-sm" />
        <div className="h-1.5 w-1.5 sm:w-4 sm:h-4 bg-white/40 rounded-full backdrop-blur-sm" />
      </div>

      {/* Minutes */}
      <div className="h-12 w-12 sm:w-[72px] sm:h-[72px] md:w-32 md:h-32 bg-white/40 rounded-lg backdrop-blur-sm" />
    </div>
  );
}
