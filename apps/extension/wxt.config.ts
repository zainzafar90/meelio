import { defineConfig } from "wxt";

export default defineConfig({
  vite: () => ({
    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
          warn(warning);
        },
      },
    },
  }),
  manifestVersion: 3,
  srcDir: "src",
  manifest: {
    name: "Meelio",
    description: "Focus, calm & productivity with every new tab",
    version: "0.9.0",
    permissions: ["storage", "notifications"],
    optional_permissions: ["tabs", "tabGroups", "bookmarks"],
    host_permissions: ["https://*.meelio.io/*"],
    optional_host_permissions: ["https://*/*"],
    web_accessible_resources: [
      {
        resources: [
          "**/*.svg",
          "**/*.png",
          "**/*.jpg",
          "**/*.webp",
          "**/*.avif",
          "**/*.mp4",
          "**/*.mp3",
          "**/*.json",
        ],
        matches: ["<all_urls>"],
      },
    ],
  },
});
