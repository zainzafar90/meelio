import { runBreathingValidation } from "./scenarios/extension-breathing-flow.mjs";

process.env.MEELIO_VALIDATION_NAME = "validate:extension:breathing";

runBreathingValidation().catch((error) => {
  console.error(`\n[validate:extension:breathing] FAILED: ${error.message}`);
  process.exitCode = 1;
});
