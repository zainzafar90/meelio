import path from "path";

import react from "@vitejs/plugin-react-swc";
import { splitVendorChunkPlugin,  defineConfig, UserConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // plugins: [react(), splitVendorChunkPlugin()],
  plugins: [react(), splitVendorChunkPlugin()] as UserConfig["plugins"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
