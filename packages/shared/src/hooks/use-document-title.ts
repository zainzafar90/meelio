import { useEffect } from "react";
import { TimerStage } from "../types/timer.types";
import { formatTime } from "../utils/timer.utils";

export interface DocumentTitleProps {
  remaining: number;
  stage: TimerStage;
  running: boolean;
}

/** Update browser tab title to reflect timer state. */
export const useDocumentTitle = ({
  remaining,
  stage,
  running,
}: DocumentTitleProps) => {
  useEffect(() => {
    const previous = document.title;
    const emoji = stage === TimerStage.Focus ? "🎯" : "☕";
    const mode = stage === TimerStage.Focus ? "Focus" : "Break";
    const title = running
      ? `${emoji} ${formatTime(remaining)} - ${mode}`
      : "Meelio - focus, calm, & productivity";
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [remaining, stage, running]);
};
