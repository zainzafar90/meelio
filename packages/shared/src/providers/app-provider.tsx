import { BrowserRouter } from "react-router-dom";

import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";

import { useSoundscapesStore } from "../stores/soundscapes.store";

import { BackgroundProvider } from "./background-provider";
import { PomodoroProvider } from "./pomodoro-provider";
import { ThemeProvider } from "../components/common/theme-provider";
import { ConnectionWarning } from "../components/common/connection-warning";
import { SoundPlayer } from "../components/core/soundscapes/components/sound-player/sound-player";
import { AuthProvider } from "./auth-provider";
// import { env } from "../utils/env.utils";
import { i18n } from "../i18n";
// import { TelemetryProvider } from "./telemetry-provider";
import { TimerService } from "../services/timer.service";

// import posthog from "posthog-js/dist/module.full.no-external";

// posthog.init(env.posthogKey, {
//   api_host: "https://app.posthog.com",
//   persistence: "localStorage",
//   autocapture: true,
//   debug: env.dev === true,
//   loaded: (posthog) => {
//     posthog.register({
//       full_url: window.location.href,
//       domain: window.location.hostname,
//     });
//   },
// });

type AppProviderProps = {
  children: React.ReactNode;
  timerService: TimerService;
};

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  timerService,
}) => {
  const sounds = useSoundscapesStore((state) => state.sounds);
  const hasPlayingSounds = sounds.some((sound) => sound.playing);

  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          {/* <TelemetryProvider> */}
          <ThemeProvider storageKey="ui-theme" defaultTheme="system">
            <TooltipProvider>
              <BackgroundProvider>
                <PomodoroProvider timerService={timerService}>
                  {children}
                  {hasPlayingSounds && <SoundPlayer />}
                  <Toaster richColors />
                  <ConnectionWarning />
                </PomodoroProvider>
              </BackgroundProvider>
            </TooltipProvider>
          </ThemeProvider>
          {/* </TelemetryProvider> */}
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
};
