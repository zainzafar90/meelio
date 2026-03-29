import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Meelio",
    description: "Focus, calm & productivity with every new tab",
    version: "0.8.3",
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
