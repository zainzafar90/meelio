import path from "path";
import { env } from "process";

import react from "@vitejs/plugin-react-swc";
import { defineConfig, splitVendorChunkPlugin, UserConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    VitePWA(
      env.NODE_ENV === "development"
        ? {}
        : {
            registerType: "autoUpdate",
            includeAssets: [
              "favicon.ico",
              "favicon-break.ico",
              "robots.txt",
              "img/*.webp",
              "sounds/*.mp3",
              "fonts/*.woff2",
            ],
            manifest: {
              name: "Meelio",
              short_name: "Meelio",
              start_url: "https://app.meelio.io",
              theme_color: "#f3742d",
              background_color: "#202020",
              icons: [
                {
                  src: "/android-chrome-64x64.png",
                  sizes: "64x64",
                  type: "image/png",
                },
                {
                  src: "/android-chrome-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src: "maskable-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "maskable",
                },
                {
                  src: "/android-chrome-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                },
              ],
            },
          }
    ),
  ] as UserConfig["plugins"],
});
