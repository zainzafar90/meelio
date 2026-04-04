import { runWallpaperValidation } from "./scenarios/extension-wallpaper-flow.mjs";

process.env.MEELIO_VALIDATION_NAME = "validate:extension:wallpaper";

runWallpaperValidation().catch((error) => {
  console.error(`\n[validate:extension:wallpaper] FAILED: ${error.message}`);
  process.exitCode = 1;
});
