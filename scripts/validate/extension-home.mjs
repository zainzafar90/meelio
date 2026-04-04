import { logStep, runCommand } from "./lib/utils.mjs";

process.env.MEELIO_VALIDATION_NAME = "validate:extension:home";

(async () => {
  logStep("Running focused greeting validator");
  await runCommand("pnpm", ["validate:extension:greeting"]);

  logStep("Running focused wallpaper validator");
  await runCommand("pnpm", ["validate:extension:wallpaper"]);

  logStep("Running focused breathing validator");
  await runCommand("pnpm", ["validate:extension:breathing"]);
})().catch((error) => {
  console.error(`\n[validate:extension:home] FAILED: ${error.message}`);
  process.exitCode = 1;
});
