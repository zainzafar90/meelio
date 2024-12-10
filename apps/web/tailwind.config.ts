import baseConfig from "@repo/tailwind-config";
import { type Config } from "tailwindcss";

export default {
  presets: [baseConfig],
  content: [
    "index.html",
    "src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/shared/src/**/*.{js,ts,jsx,tsx}",
  ],
} satisfies Config;
