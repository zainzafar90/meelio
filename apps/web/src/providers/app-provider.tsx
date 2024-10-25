import { BrowserRouter } from "react-router-dom";

import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";

import { ConnectionWarning } from "@/components/connection-warning";
import { SoundPlayer } from "@/components/soundscape/sound-player/sound-player";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer";
import { useAuthStore } from "@/store/auth.store";

import { AuthProvider } from "./auth-provider";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const { user } = useAuthStore();
  usePomodoroTimer({ user });

  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider storageKey="ui-theme" defaultTheme="system">
          <TooltipProvider>
            {children}
            <SoundPlayer />
            <Toaster richColors />
            <Analytics />
            <ConnectionWarning />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
