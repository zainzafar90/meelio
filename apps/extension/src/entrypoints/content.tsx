import { defineContentScript } from "wxt/utils/define-content-script";

import { sendExtensionCommand } from "../features/site-blocker/services/blocker-runtime";
import { normalizeSiteHost } from "../utils/site-blocker.utils";

const TRACKING_FLUSH_INTERVAL_MS = 15_000;

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_start",
  main() {
    if (window.top !== window.self) {
      return;
    }

    const sessionId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const host = normalizeSiteHost(window.location.hostname);

    let activeStartedAt = 0;
    let accumulatedDurationMs = 0;
    let closed = false;

    const isActive = () =>
      document.visibilityState === "visible" && document.hasFocus();

    const startActiveWindow = () => {
      if (!isActive() || activeStartedAt !== 0) {
        return;
      }

      activeStartedAt = Date.now();
    };

    const stopActiveWindow = () => {
      if (activeStartedAt === 0) {
        return;
      }

      accumulatedDurationMs += Date.now() - activeStartedAt;
      activeStartedAt = 0;
    };

    const currentDurationMs = () =>
      accumulatedDurationMs +
      (activeStartedAt === 0 ? 0 : Date.now() - activeStartedAt);

    const createPayload = () => ({
      sessionId,
      url: window.location.href,
      host,
      startedAt,
      observedAt: new Date().toISOString(),
      durationMs: currentDurationMs(),
    });

    const flushUpdate = () => {
      void sendExtensionCommand({
        type: "tracking/session-update",
        payload: createPayload(),
      }).catch(() => {
        // Best-effort tracking only.
      });
    };

    const finishSession = () => {
      if (closed) {
        return;
      }

      closed = true;
      stopActiveWindow();
      window.clearInterval(intervalId);
      detachListeners();

      void sendExtensionCommand({
        type: "tracking/session-end",
        payload: {
          ...createPayload(),
          endedAt: new Date().toISOString(),
        },
      }).catch(() => {
        // Best-effort tracking only.
      });
    };

    const handleActivityChange = () => {
      if (isActive()) {
        startActiveWindow();
        return;
      }

      stopActiveWindow();
      flushUpdate();
    };

    const detachListeners = () => {
      document.removeEventListener("visibilitychange", handleActivityChange);
      window.removeEventListener("focus", handleActivityChange, true);
      window.removeEventListener("blur", handleActivityChange, true);
      window.removeEventListener("pagehide", finishSession, true);
      window.removeEventListener("beforeunload", finishSession, true);
    };

    startActiveWindow();
    flushUpdate();

    const intervalId = window.setInterval(() => {
      if (closed) {
        return;
      }

      flushUpdate();
    }, TRACKING_FLUSH_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleActivityChange);
    window.addEventListener("focus", handleActivityChange, true);
    window.addEventListener("blur", handleActivityChange, true);
    window.addEventListener("pagehide", finishSession, true);
    window.addEventListener("beforeunload", finishSession, true);
  },
});
