import React from "react";
import ReactDOM from "react-dom/client";

import { registerSW } from "virtual:pwa-register";

import { App } from "./app";
import { AppUpdatedAlert } from "./components/app-updated-alert";

import "@/styles/globals.css";

import { useUpdateAlertStore } from "./stores/useUpdateAlertStore";

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

const initializeSW = () => {
  registerSW({
    onRegistered(r) {
      console.log("Service Worker registered");
      r && setInterval(checkForUpdates, INTERVAL_MS);
    },
    onNeedRefresh() {
      console.log("New content available, please refresh.");
      useUpdateAlertStore.getState().setShowUpdateAlert(true);
    },
    onOfflineReady() {
      console.log("The app is ready to work offline.");
    },
  });
};

const checkForUpdates = async () => {
  if (!navigator.onLine) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  } catch (error) {
    console.error("Error checking for updates: ", error);
  }
};

initializeSW();

const AppContainer = () => {
  const showUpdateAlert = useUpdateAlertStore((state) => state.showUpdateAlert);

  return (
    <>
      {showUpdateAlert && <AppUpdatedAlert />}
      <App />
    </>
  );
};

// updateSW();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>
);
