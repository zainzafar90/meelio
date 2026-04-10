import type { ReactNode } from "react";
import { CalendarDays, CheckSquare2, Timer } from "lucide-react";
import { m } from "framer-motion";

import { AmbientPill } from "./ambient-pill";
import { FocusTaskHeading } from "./focus-task-heading";

export interface FocusModeShellViewModel {
  topPills: {
    currentTimerLabel: string;
    completedTaskCountLabel: string;
    calendarPillValue: string | null;
    focusPillLabel: string;
    calendarPillLabel: string;
    todayPillLabel: string;
  };
  taskHeading: {
    activeFocusTaskLabel: string;
    activeFocusTaskId: string | null;
    activeFocusTaskEyebrow: string;
  };
}

interface FocusModeShellProps {
  viewModel: FocusModeShellViewModel;
  timerPanel: ReactNode;
  onSelectTask: () => void;
}

export const FocusModeShell = ({ viewModel, timerPanel, onSelectTask }: FocusModeShellProps) => (
  <div className="relative flex min-h-0 flex-1 items-center justify-center">
    <div className="pointer-events-none absolute inset-0 bg-black/7 backdrop-blur-[8px]" />
    <div className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_18%),radial-gradient(circle_at_center,rgba(0,0,0,0.20),transparent_58%),linear-gradient(to_bottom,rgba(0,0,0,0.13),transparent_28%)]" />
    <div className="relative flex h-full w-full max-w-full flex-col">
      <div className="hidden items-center justify-between px-4 py-3 [@media(min-height:580px)]:flex">
        <div className="flex flex-1 justify-start">
          <AmbientPill
            icon={<Timer className="size-3.5" />}
            label={viewModel.topPills.focusPillLabel}
            value={viewModel.topPills.currentTimerLabel}
          />
        </div>
        <div className="flex flex-1 justify-center">
          {viewModel.topPills.calendarPillValue ? (
            <AmbientPill
              icon={<CalendarDays className="size-3.5" />}
              label={viewModel.topPills.calendarPillLabel}
              value={viewModel.topPills.calendarPillValue}
            />
          ) : null}
        </div>
        <div className="flex flex-1 justify-end">
          <AmbientPill
            icon={<CheckSquare2 className="size-3.5" />}
            label={viewModel.topPills.todayPillLabel}
            value={viewModel.topPills.completedTaskCountLabel}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-4 pb-6">
        <FocusTaskHeading
          eyebrow={viewModel.taskHeading.activeFocusTaskEyebrow}
          label={viewModel.taskHeading.activeFocusTaskLabel}
          isSelectable={!viewModel.taskHeading.activeFocusTaskId}
          onSelectTask={onSelectTask}
          headingClassName="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.16)] sm:text-4xl"
        />
        <m.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.28, ease: "easeOut", delay: 0.04 }}
          className="w-full"
        >
          {timerPanel}
        </m.div>
      </div>
    </div>
  </div>
);
