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
});

updateSW();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
