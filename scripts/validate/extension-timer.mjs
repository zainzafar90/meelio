import { runTimerValidation } from "./scenarios/extension-timer-flow.mjs";

process.env.MEELIO_VALIDATION_NAME = "validate:extension:timer";

runTimerValidation().catch((error) => {
  console.error(`\n[validate:extension:timer] FAILED: ${error.message}`);
  process.exitCode = 1;
});
