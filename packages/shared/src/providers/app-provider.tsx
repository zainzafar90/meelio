import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";

import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";

import { useSoundscapesStore } from "../stores/soundscapes.store";

import { ThemeProvider } from "../components/common/theme-provider";
import { SoundPlayer } from "../components/core/soundscapes/components/sound-player/sound-player";
import { SoundSyncInitializer } from "../components/core/soundscapes/sound-sync-initializer";
import { AuthProvider } from "./auth-provider";
import { i18n } from "../i18n";
import { TelemetryProvider } from "./telemetry-provider";
import { useCalendar } from "../hooks/use-calendar";
import { useWeather } from "../hooks/use-weather";
import { initializeSoundscapesTimerIntegration, cleanupSoundscapesTimerIntegration } from "../stores/soundscapes-timer-integration";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const sounds = useSoundscapesStore((state) => state.sounds);
  const hasPlayingSounds = sounds.some((sound) => sound.playing);

  useCalendar();
  useWeather();

  useEffect(() => {
    initializeSoundscapesTimerIntegration();
    return () => {
      cleanupSoundscapesTimerIntegration();
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <TelemetryProvider>
            <ThemeProvider storageKey="ui-theme" defaultTheme="dark">
              <TooltipProvider>
                {children}
                <SoundSyncInitializer />
                {hasPlayingSounds && <SoundPlayer />}
                <Toaster richColors />
              </TooltipProvider>
            </ThemeProvider>
          </TelemetryProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
};
