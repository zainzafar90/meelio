import path from "path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig, splitVendorChunkPlugin, UserConfig } from "vite";

export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()] as UserConfig["plugins"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
