
import baseConfig from "@repo/tailwind-config";
import { type Config } from "tailwindcss";

export default {
  presets: [baseConfig],
  content: [
    "src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
} satisfies Config;
