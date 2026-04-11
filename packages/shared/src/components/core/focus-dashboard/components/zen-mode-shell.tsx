import type { ReactNode } from "react";
import { m } from "framer-motion";

import type { FocusDashboardZenModeProps } from "../focus-dashboard.types";
import { FocusTaskHeading } from "./focus-task-heading";

interface ZenModeShellProps {
  viewModel: FocusDashboardZenModeProps;
  timerPanel: ReactNode;
  onSelectTask: () => void;
}

export const ZenModeShell = ({ viewModel, timerPanel, onSelectTask }: ZenModeShellProps) => (
  <div className="relative flex min-h-0 flex-1 items-center justify-center">
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 pb-20">
      <div className="max-w-5xl text-center">
        <FocusTaskHeading
          eyebrow={viewModel.activeFocusTaskEyebrow}
          label={viewModel.activeFocusTaskLabel}
          isSelectable={!viewModel.activeFocusTaskId}
          isEmptyState={viewModel.isEmptyState}
          onSelectTask={onSelectTask}
          containerClassName="w-full"
          headingClassName={
            viewModel.isEmptyState
              ? "text-balance text-2xl font-medium tracking-tight text-white/88 drop-shadow-[0_8px_22px_rgba(0,0,0,0.14)] sm:text-3xl lg:text-[2.55rem]"
              : "text-balance text-3xl font-semibold tracking-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.16)] sm:text-4xl lg:text-5xl"
          }
        />
      </div>
      {viewModel.timerEnabled ? (
        <m.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.28, ease: "easeOut", delay: 0.04 }}
          className="w-full"
        >
          {timerPanel}
        </m.div>
      ) : null}
    </div>
  </div>
);
