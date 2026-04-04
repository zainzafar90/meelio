import { runBlockerValidation } from "./scenarios/extension-blocker-flow.mjs";

process.env.MEELIO_VALIDATION_NAME = "validate:extension:blocker";

runBlockerValidation().catch((error) => {
  console.error(`\n[validate:extension:blocker] FAILED: ${error.message}`);
  process.exitCode = 1;
});
