import type { ReactNode } from "react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
} from "framer-motion";

import { FocusModeShell } from "./components/focus-mode-shell";
import { HomeModeShell } from "./components/home-mode-shell";
import { ZenModeShell } from "./components/zen-mode-shell";
import { ZenSessionControls } from "./components/zen-session-controls";
import { useFocusDashboardDerivedState } from "./hooks/use-focus-dashboard-derived-state";
import { useFocusDashboardEffects } from "./hooks/use-focus-dashboard-effects";
import { useFocusDashboardState } from "./hooks/use-focus-dashboard-state";
import type { TimerStoreHook } from "./focus-dashboard.types";

interface FocusDashboardProps {
  timerStore: TimerStoreHook;
  timerPanel: ReactNode;
}

export const FocusDashboard = ({
  timerStore,
  timerPanel,
}: FocusDashboardProps) => {
  const state = useFocusDashboardState({ timerStore });
  const derived = useFocusDashboardDerivedState(state);
  const effects = useFocusDashboardEffects({ state, derived, timerStore });

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex h-full w-full flex-col overflow-hidden px-2 pb-2 pt-2 sm:px-4">
        <AnimatePresence mode="wait" initial={false}>
          {derived.showTimerPanel ? (
            <m.div
              key="focus-mode"
              initial={
                state.reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 18, filter: "blur(10px)" }
              }
              animate={
                state.reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              exit={
                state.reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -12, filter: "blur(8px)" }
              }
              transition={{
                duration: state.reduceMotion ? 0.18 : 0.3,
                ease: "easeOut",
              }}
              className="flex min-h-0 flex-1"
            >
              {derived.showZenModeShell ? (
                <ZenModeShell
                  viewModel={derived.zenModeProps}
                  timerPanel={timerPanel}
                  onSelectTask={state.toggleTasks}
                />
              ) : (
                <FocusModeShell
                  viewModel={derived.focusModeProps}
                  timerPanel={timerPanel}
                  onSelectTask={state.toggleTasks}
                />
              )}
            </m.div>
          ) : (
            <m.div
              key="home-mode"
              initial={
                state.reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 14, filter: "blur(10px)" }
              }
              animate={
                state.reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              exit={
                state.reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -10, filter: "blur(8px)" }
              }
              transition={{
                duration: state.reduceMotion ? 0.18 : 0.28,
                ease: "easeOut",
              }}
              className="flex min-h-0 flex-1"
            >
              <HomeModeShell
                homeModeProps={derived.homeModeProps}
                onConfigure={effects.handleConfigureZenMode}
                onStartZenMode={effects.handleStartZenMode}
              />
            </m.div>
          )}
        </AnimatePresence>

        {derived.showZenModeShell ? (
          <ZenSessionControls
            windowFocused={effects.zenWindowFocused}
            summaryItems={derived.zenSessionControlsProps.summaryItems}
            endZenLabel={derived.zenSessionControlsProps.endZenLabel}
            configureLabel={derived.zenSessionControlsProps.configureLabel}
            onEndZen={effects.handleEndZenMode}
            onConfigure={effects.handleConfigureZenMode}
          />
        ) : null}
      </div>
    </LazyMotion>
  );
};
