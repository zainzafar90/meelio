import { BrowserRouter } from "react-router-dom";

import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";

import { ConnectionWarning } from "@/components/connection-warning";
import { SoundPlayer } from "@/components/soundscape/sound-player/sound-player";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "./auth-provider";
import { PomodoroProvider } from "./pomodoro-provider";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider storageKey="ui-theme" defaultTheme="system">
          <TooltipProvider>
            <PomodoroProvider>
              {children}
              <SoundPlayer />
              <Toaster richColors />
              <Analytics />
              <ConnectionWarning />
            </PomodoroProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
