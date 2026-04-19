import type { ReactNode } from "react";
import { CalendarDays, CheckSquare2 } from "lucide-react";
import { m } from "framer-motion";

import type { FocusDashboardZenLaunchProps } from "../focus-dashboard.types";
import { AmbientPill } from "./ambient-pill";
import { FocusTaskHeading } from "./focus-task-heading";
import { ZenLaunchRail } from "./zen-launch-rail";

export interface FocusModeShellViewModel {
  topPills: {
    completedTaskCountLabel: string;
    calendarPillValue: string | null;
    calendarPillLabel: string;
    todayPillLabel: string;
    zenLaunch: FocusDashboardZenLaunchProps;
  };
  taskHeading: {
    activeFocusTaskLabel: string;
    activeFocusTaskId: string | null;
    activeFocusTaskEyebrow: string;
    isEmptyState: boolean;
  };
}

interface FocusModeShellProps {
  viewModel: FocusModeShellViewModel;
  timerPanel: ReactNode;
  onSelectTask: () => void;
  onConfigureZenMode: () => void;
  onStartZenMode: () => void;
}

export const FocusModeShell = ({
  viewModel,
  timerPanel,
  onSelectTask,
  onConfigureZenMode,
  onStartZenMode,
}: FocusModeShellProps) => (
  <div className="relative flex min-h-0 flex-1 items-center justify-center">
    <div className="pointer-events-none absolute inset-0 bg-black/7 backdrop-blur-[8px]" />
    <div className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_18%),radial-gradient(circle_at_center,rgba(0,0,0,0.20),transparent_58%),linear-gradient(to_bottom,rgba(0,0,0,0.13),transparent_28%)]" />
    <div className="relative flex h-full w-full max-w-full flex-col">
      <div className="hidden items-center justify-between px-4 py-3 [@media(min-height:580px)]:flex">
        <div className="flex flex-1 justify-start">
          <ZenLaunchRail
            focusPillLabel={viewModel.topPills.zenLaunch.focusPillLabel}
            focusPillValue={viewModel.topPills.zenLaunch.focusPillValue}
            startFocusingLabel={viewModel.topPills.zenLaunch.startFocusingLabel}
            zenHeadline={viewModel.topPills.zenLaunch.zenHeadline}
            zenSubtitle={viewModel.topPills.zenLaunch.zenSubtitle}
            zenStatusItems={viewModel.topPills.zenLaunch.zenStatusItems}
            configureLabel={viewModel.topPills.zenLaunch.configureLabel}
            onConfigure={onConfigureZenMode}
            onStartFocusing={onStartZenMode}
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
          isEmptyState={viewModel.taskHeading.isEmptyState}
          onSelectTask={onSelectTask}
          headingClassName={
            viewModel.taskHeading.isEmptyState
              ? "max-w-3xl text-balance text-2xl font-medium tracking-tight text-white/88 drop-shadow-[0_8px_22px_rgba(0,0,0,0.14)] sm:text-3xl"
              : "max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.16)] sm:text-4xl"
          }
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
