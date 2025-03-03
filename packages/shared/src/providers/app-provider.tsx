import { BrowserRouter } from "react-router-dom";

import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";

import { useSoundscapesStore } from "../stores/soundscapes.store";

import { ThemeProvider } from "../components/common/theme-provider";
import { ConnectionWarning } from "../components/common/connection-warning";
import { SoundPlayer } from "../components/core/soundscapes/components/sound-player/sound-player";
import { AuthProvider } from "./auth-provider";
import { i18n } from "../i18n";
import { TelemetryProvider } from "./telemetry-provider";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const sounds = useSoundscapesStore((state) => state.sounds);
  const hasPlayingSounds = sounds.some((sound) => sound.playing);

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
                {hasPlayingSounds && <SoundPlayer />}
                <Toaster richColors />
                <ConnectionWarning />
              </TooltipProvider>
            </ThemeProvider>
          </TelemetryProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
};
