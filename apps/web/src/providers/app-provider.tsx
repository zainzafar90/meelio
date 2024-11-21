import { BrowserRouter } from "react-router-dom";

import i18n from "@/i18n/i18n";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";

import { SoundPlayer } from "@/routes/home/components/soundscapes/components/sound-player/sound-player";
import { ConnectionWarning } from "@/components/connection-warning";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "./auth-provider";
import { PomodoroProvider } from "./pomodoro-provider";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <ThemeProvider storageKey="ui-theme" defaultTheme="system">
            <TooltipProvider>
              <PomodoroProvider>
                {children}
                <SoundPlayer />
                <Toaster richColors />
                <ConnectionWarning />
              </PomodoroProvider>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
};
