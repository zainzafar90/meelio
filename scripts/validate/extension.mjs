import { runExtensionValidation } from "./scenarios/extension-flow.mjs";

runExtensionValidation().catch((error) => {
  console.error(`\n[validate:extension] FAILED: ${error.message}`);
  process.exitCode = 1;
});
