import { runGreetingValidation } from "./scenarios/extension-greeting-flow.mjs";

process.env.MEELIO_VALIDATION_NAME = "validate:extension:greeting";

runGreetingValidation().catch((error) => {
  console.error(`\n[validate:extension:greeting] FAILED: ${error.message}`);
  process.exitCode = 1;
});
