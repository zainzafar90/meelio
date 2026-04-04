import { logStep, runCommand } from "./lib/utils.mjs";

process.env.MEELIO_VALIDATION_NAME = "validate:extension";

(async () => {
  logStep("Running focused home validator");
  await runCommand("pnpm", ["validate:extension:home"]);

  logStep("Running focused timer validator");
  await runCommand("pnpm", ["validate:extension:timer"]);

  logStep("Running focused blocker validator");
  await runCommand("pnpm", ["validate:extension:blocker"]);
})().catch((error) => {
  console.error(`\n[validate:extension] FAILED: ${error.message}`);
  process.exitCode = 1;
});
