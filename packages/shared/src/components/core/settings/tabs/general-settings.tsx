import { useTranslation } from "react-i18next";
import { Switch } from "@repo/ui/components/ui/switch";
import { Button } from "@repo/ui/components/ui/button";
import { useAppStore } from "../../../../stores/app.store";
import { useOnboardingStore } from "../../../../stores/onboarding.store";
import { useAuthStore } from "../../../../stores/auth.store";
import { useCalendarStore } from "../../../../stores/calendar.store";
import {
  getCalendarAuthUrl,
  deleteCalendarToken,
} from "../../../../api/calendar.api";
import { api } from "../../../../api";
import { useShallow } from "zustand/shallow";
import { toast } from "sonner";
import { useState } from "react";
import { LoginButton } from "../components/common/login-protected";

export function GeneralSettings({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingConfetti, setIsUpdatingConfetti] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const {
    mantraRotationEnabled,
    setMantraRotation,
    wallpaperRotationEnabled,
    setWallpaperRotationEnabled,
    twelveHourClock,
    setTwelveHourClock,
  } = useAppStore(
    useShallow((state) => ({
      mantraRotationEnabled: state.mantraRotationEnabled,
      setMantraRotation: state.setMantraRotation,
      wallpaperRotationEnabled: state.wallpaperRotationEnabled,
      setWallpaperRotationEnabled: state.setWallpaperRotationEnabled,
      twelveHourClock: state.twelveHourClock,
      setTwelveHourClock: state.setTwelveHourClock,
    }))
  );

  const { triggerOnboardingUpdate } = useOnboardingStore(
    useShallow((state) => ({
      triggerOnboardingUpdate: state.triggerOnboardingUpdate,
    }))
  );

  const { user, guestUser, authenticate } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
      authenticate: state.authenticate,
    }))
  );

  const { token, connectedEmail, clearCalendar } = useCalendarStore(
    useShallow((state) => ({
      token: state.token,
      connectedEmail: state.connectedEmail,
      clearCalendar: state.clearCalendar,
    }))
  );

  const confettiOnComplete = user?.settings?.task?.confettiOnComplete ?? false;
  const calendarEnabled = user?.settings?.calendar?.enabled ?? false;
  const isCalendarConnected = !!token;
  const isGuestUser = !!guestUser && !user;

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    try {
      await triggerOnboardingUpdate(false);
      onClose();
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
      toast.error(t("settings.general.onboardingReset.error"));
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleConfetti = async () => {
    const newValue = !confettiOnComplete;
    setIsUpdatingConfetti(true);
    try {
      if (user) {
        const updatedUser = {
          ...user,
          settings: {
            ...user.settings,
            task: {
              ...user.settings?.task,
              confettiOnComplete: newValue,
            },
          },
        };
        authenticate(updatedUser);
      }

      await api.settings.settingsApi.updateTaskSettings({
        confettiOnComplete: newValue,
      });
    } catch (error) {
      console.error("Failed to update confetti setting:", error);
      toast.error(t("settings.general.confettiOnComplete.error"));
    } finally {
      setIsUpdatingConfetti(false);
    }
  };

  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    try {
      // Redirect to OAuth (calendar.enabled defaults to true from backend)
      const response = await getCalendarAuthUrl();
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error("Failed to connect calendar:", error);
      toast.error("Failed to connect calendar");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    setIsDisconnecting(true);
    try {
      // Delete tokens from backend (automatically disables calendar settings)
      await deleteCalendarToken();

      // Update local user state to reflect the backend changes
      if (user) {
        const updatedUser = {
          ...user,
          settings: {
            ...user.settings,
            calendar: {
              ...user.settings?.calendar,
              enabled: false,
            },
          },
        };
        authenticate(updatedUser);
      }

      // Clear frontend calendar data
      clearCalendar();
      toast.success("Calendar disconnected and features hidden");
    } catch (error) {
      console.error("Failed to disconnect calendar:", error);
      toast.error("Failed to disconnect calendar");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleToggleCalendarVisibility = async () => {
    const newValue = !calendarEnabled;
    setIsUpdatingVisibility(true);
    try {
      await api.settings.settingsApi.updateCalendarSettings({
        enabled: newValue,
      });

      if (user) {
        const updatedUser = {
          ...user,
          settings: {
            ...user.settings,
            calendar: {
              ...user.settings?.calendar,
              enabled: newValue,
            },
          },
        };
        authenticate(updatedUser);
      }

      toast.success(
        newValue ? "Calendar features shown" : "Calendar features hidden"
      );
    } catch (error) {
      console.error("Failed to update calendar visibility:", error);
      toast.error("Failed to update calendar visibility");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => setMantraRotation(!mantraRotationEnabled)}
      >
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("settings.general.mantraRotation.description")}
            </p>
          </div>
        </div>
        <Switch
          size="sm"
          checked={mantraRotationEnabled}
          onCheckedChange={(value) => setMantraRotation(value)}
          aria-label={`${t("common.actions.toggle")} ${t("settings.general.mantraRotation.title")}`}
        />
      </div>

      <div
        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => setWallpaperRotationEnabled(!wallpaperRotationEnabled)}
      >
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("settings.general.wallpaperRotation.description")}
            </p>
          </div>
        </div>
        <Switch
          size="sm"
          checked={wallpaperRotationEnabled}
          onCheckedChange={(value) => setWallpaperRotationEnabled(value)}
          aria-label={`${t("common.actions.toggle")} ${t("settings.general.wallpaperRotation.title")}`}
        />
      </div>

      {user && (
        <div className="flex items-center justify-between rounded-lg border p-4 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t("settings.general.onboardingReset.title")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("settings.general.onboardingReset.description")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetOnboarding}
            disabled={isResetting}
          >
            {isResetting ? "..." : t("settings.general.onboardingReset.button")}
          </Button>
        </div>
      )}

      {user && (
        <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t("settings.general.confettiOnComplete.title")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("settings.general.confettiOnComplete.description")}
              </p>
            </div>
          </div>
          <Switch
            size="sm"
            checked={confettiOnComplete}
            onCheckedChange={handleToggleConfetti}
            disabled={isUpdatingConfetti}
            aria-label={`${t("common.actions.toggle")} ${t("settings.general.confettiOnComplete.title")}`}
          />
        </div>
      )}

      {(user || guestUser) && (
        <>
          <div
            className={`rounded-lg border p-6 transition-colors ${isGuestUser ? "opacity-90" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-4 flex-1 min-w-0">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      Google Calendar Integration
                    </h3>
                    {/* {isGuestUser && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Users Only
                      </span>
                    )} */}
                    {!isGuestUser && isCalendarConnected && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                          Connected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {isGuestUser ? (
                  <LoginButton>
                    <Button
                      size="sm"
                      className="min-w-[100px]"
                      variant="outline"
                    >
                      Login to Connect
                    </Button>
                  </LoginButton>
                ) : isCalendarConnected ? (
                  <Button
                    onClick={handleDisconnectCalendar}
                    variant="outline"
                    size="sm"
                    disabled={isDisconnecting}
                    className="min-w-[100px]"
                  >
                    {isDisconnecting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs">Disconnecting</span>
                      </div>
                    ) : (
                      "Disconnect"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnectCalendar}
                    size="sm"
                    disabled={isConnecting}
                    className="min-w-[100px]"
                  >
                    {isConnecting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs">Connecting</span>
                      </div>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pr-4">
              {isGuestUser ? (
                "Sign up for a free account to connect your Google Calendar and see upcoming events"
              ) : isCalendarConnected && connectedEmail ? (
                <span>
                  {" "}
                  Connected to{" "}
                  <span className="font-medium text-blue-600">
                    {connectedEmail}
                  </span>
                  . Access events and display upcoming meetings directly in your
                  workspace.
                </span>
              ) : (
                "Connect your Google Calendar to access events and display upcoming meetings directly in your workspace"
              )}
            </p>
          </div>

          {!isGuestUser && isCalendarConnected && (
            <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Show Calendar Features</p>
                  <p className="text-sm text-muted-foreground">
                    Display upcoming events and calendar widgets. This only
                    hides features, doesn't revoke Google access.
                  </p>
                </div>
              </div>
              <Switch
                size="sm"
                checked={calendarEnabled}
                onCheckedChange={handleToggleCalendarVisibility}
                disabled={isUpdatingVisibility}
                aria-label="Toggle Calendar Features Visibility"
              />
            </div>
          )}
        </>
      )}

      <div
        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => setTwelveHourClock(!twelveHourClock)}
      >
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("settings.general.twelveHourClock.description")}
            </p>
          </div>
        </div>
        <Switch
          size="sm"
          checked={!twelveHourClock}
          onCheckedChange={(value) => setTwelveHourClock(!value)}
          aria-label={`${t("common.actions.toggle")} ${t("settings.general.twelveHourClock.title")}`}
        />
      </div>
    </div>
  );
}
