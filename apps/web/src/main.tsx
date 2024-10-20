import React from "react";
import ReactDOM from "react-dom/client";

import { registerSW } from "virtual:pwa-register";

import { App } from "./app";

import "@/styles/globals.css";

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const updateSW = registerSW({
  onRegisteredSW(swUrl, r) {
    r &&
      setInterval(async () => {
        if (r.installing || !navigator) return;

        if ("connection" in navigator && !navigator.onLine) return;

        const resp = await fetch(swUrl, {
          cache: "no-store",
          headers: {
            cache: "no-store",
            "cache-control": "no-cache",
          },
        });

        if (resp?.status === 200) await r.update();
      }, INTERVAL_MS);
  },
  onNeedRefresh() {
    const userConfirmed = window.confirm(
      "New content is available. Would you like to refresh?"
    );
    if (userConfirmed) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("The app is ready to work offline.");
  },
});

updateSW();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
