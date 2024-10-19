import path from "path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig, splitVendorChunkPlugin, UserConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(), splitVendorChunkPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-break.ico',
        'robots.txt',
        'img/*.webp',
        'sounds/*.mp3',
        'fonts/*.woff2'
      ],
      manifest: {
        theme_color: '#BD34FE',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ] as UserConfig["plugins"],
 
});
