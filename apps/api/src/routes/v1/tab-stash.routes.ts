import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { tabStashController } from "@/modules/tab-stash";
import { tabStashValidation } from "@/modules/tab-stash/tab-stash-bulk.validation";
import requirePro from "@/modules/auth/requirePro.middleware";

const router = express.Router();

// Get all tab stashes for sync
router.get("/", auth(), requirePro(), tabStashController.getTabStashes);

// Bulk sync endpoint
router.post(
  "/bulk",
  auth(),
  requirePro(),
  validate(tabStashValidation.bulkSync),
  tabStashController.bulkSync
);

export default router;
