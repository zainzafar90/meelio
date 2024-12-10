import { BrowserRouter } from "react-router-dom";

import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";

import { Telemetry } from "../lib/telemetry/telemetry";
import { useSoundscapesStore } from "../stores/soundscapes.store";

import { BackgroundProvider } from "./background-provider";
import { PomodoroProvider } from "./pomodoro-provider";
import { ThemeProvider } from "../components/common/theme-provider";
import { ConnectionWarning } from "../components/common/connection-warning";
import { SoundPlayer } from "../components/core/soundscapes/components/sound-player/sound-player";
import { AuthProvider } from "./auth-provider";

import { i18n } from "@repo/shared";
import { useEffect } from "react";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const { sounds } = useSoundscapesStore((state) => ({
    sounds: state.sounds,
  }));

  const hasPlayingSounds = sounds.some((sound) => sound.playing);

  // useEffect(() => {
  //   console.log(Telemetry.instance);
  // }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
};
