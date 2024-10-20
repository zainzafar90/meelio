import React from "react";
import ReactDOM from "react-dom/client";

import { registerSW } from "virtual:pwa-register";

import { App } from "./app";
import { AppUpdatedAlert } from "./components/app-updated-alert";

import "@/styles/globals.css";

import { useUpdateAlertStore } from "./stores/useUpdateAlertStore";

const INTERVAL_MS = 10 * 1000; // 1 hour

const updateSW = registerSW({
  onRegisteredSW(swUrl, r) {
    r &&
      setInterval(async () => {
        if (r.installing || !navigator) return;

        if ("connection" in navigator && !navigator.onLine) return;

        await fetch(swUrl, {
          cache: "no-store",
          headers: {
            cache: "no-store",
            "cache-control": "no-cache",
          },
        });
      }, INTERVAL_MS);
  },
  onNeedRefresh() {
    useUpdateAlertStore.getState().setShowUpdateAlert(true);
  },
  onOfflineReady() {
    console.log("The app is ready to work offline.");
  },
});

const AppContainer = () => {
  const showUpdateAlert = useUpdateAlertStore((state) => state.showUpdateAlert);

  const handleRefresh = () => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update().then(() => {
          window.location.reload();
        });
      }
    });
  };

  return (
    <>
      {showUpdateAlert && <AppUpdatedAlert onRefresh={handleRefresh} />}
      <App />
    </>
  );
};

updateSW();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>
);
