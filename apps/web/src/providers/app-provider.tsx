import { BrowserRouter } from "react-router-dom";

import i18n from "@/i18n/i18n";
import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";

import { ConnectionWarning } from "@/components/connection-warning";
import { ThemeProvider } from "@/components/theme-provider";
import { useSoundscapesStore } from "@/stores/soundscapes.store";

import { AuthProvider } from "./auth-provider";
import { BackgroundProvider } from "./background-provider";
import { PomodoroProvider } from "./pomodoro-provider";
import { SoundPlayer } from "@repo/shared";



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
