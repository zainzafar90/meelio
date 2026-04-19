import { CalendarDays, CheckSquare2 } from "lucide-react";

import type { FocusDashboardHomeModeProps } from "../focus-dashboard.types";
import { Clock } from "../../clock";
import { Greeting } from "../../greetings/greetings-mantras";
import { AmbientPill } from "./ambient-pill";
import { ZenLaunchRail } from "./zen-launch-rail";

interface HomeModeShellProps {
  homeModeProps: FocusDashboardHomeModeProps;
  onConfigure: () => void;
  onStartZenMode: () => void;
}

export const HomeModeShell = ({ homeModeProps, onConfigure, onStartZenMode }: HomeModeShellProps) => (
  <div className="relative flex min-h-0 flex-1 flex-col">
    <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 px-4 py-3">
      <div className="flex flex-1 justify-start">
        <ZenLaunchRail
          focusPillLabel={homeModeProps.focusPillLabel}
          focusPillValue={homeModeProps.focusPillValue}
          startFocusingLabel={homeModeProps.startFocusingLabel}
          zenHeadline={homeModeProps.zenHeadline}
          zenSubtitle={homeModeProps.zenSubtitle}
          zenStatusItems={homeModeProps.zenStatusItems}
          configureLabel={homeModeProps.configureLabel}
          onConfigure={onConfigure}
          onStartFocusing={onStartZenMode}
        />
      </div>
      <div className="flex flex-1 justify-center">
        {homeModeProps.calendarPillValue ? (
          <AmbientPill
            icon={<CalendarDays className="size-3.5" />}
            label={homeModeProps.calendarPillLabel}
            value={homeModeProps.calendarPillValue}
          />
        ) : null}
      </div>
      <div className="flex flex-1 justify-end">
        <AmbientPill
          icon={<CheckSquare2 className="size-3.5" />}
          label={homeModeProps.tasksPillLabel}
          value={homeModeProps.queuedTaskCountLabel}
        />
      </div>
    </div>

    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-28 text-center sm:pb-32">
      <div className="max-w-5xl space-y-6">
        <Clock />
        <div className="space-y-2">
          <div className="[&_h2]:mb-0 [&_h2]:mt-0 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight sm:[&_h2]:text-3xl md:[&_h2]:text-4xl">
            <Greeting />
          </div>
        </div>
      </div>
    </div>

  </div>
);
