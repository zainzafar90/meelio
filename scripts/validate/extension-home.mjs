import { runHomeValidation } from "./scenarios/extension-home-flow.mjs";

process.env.MEELIO_VALIDATION_NAME = "validate:extension:home";

runHomeValidation().catch((error) => {
  console.error(`\n[validate:extension:home] FAILED: ${error.message}`);
  process.exitCode = 1;
});
