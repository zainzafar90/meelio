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
import { TelemetryProvider } from "./telemetry-provider";

import { i18n } from "@repo/shared";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const { sounds } = useSoundscapesStore((state) => ({
    sounds: state.sounds,
  }));

  const hasPlayingSounds = sounds.some((sound) => sound.playing);

  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <TelemetryProvider>
            <ThemeProvider storageKey="ui-theme" defaultTheme="system">
              <TooltipProvider>
                <BackgroundProvider>
                  <PomodoroProvider>
                    {children}
                    {hasPlayingSounds && <SoundPlayer />}
                    <Toaster richColors />
                    <ConnectionWarning />
                  </PomodoroProvider>
                </BackgroundProvider>
              </TooltipProvider>
            </ThemeProvider>
          </TelemetryProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
};
