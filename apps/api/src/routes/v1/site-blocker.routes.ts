import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { siteBlockerController } from "@/modules/site-blocker";
import { siteBlockerValidation } from "@/modules/site-blocker/site-blocker-bulk.validation";
import requirePro from "@/modules/auth/requirePro.middleware";

const router = express.Router();

// Get all site blockers for sync
router.get("/", auth(), requirePro(), siteBlockerController.getSiteBlockers);

// Bulk sync endpoint
router.post(
  "/bulk",
  auth(),
  requirePro(),
  validate(siteBlockerValidation.bulkSync),
  siteBlockerController.bulkSync
);

export default router;
