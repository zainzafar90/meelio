import { Router } from "express";
import { validate } from "@/common/validate";
import { auth } from "@/modules/auth";
import { syncController, syncValidation } from "@/modules/sync";

const router = Router();

router.post(
  "/bulk",
  auth(),
  validate(syncValidation.bulkSync),
  syncController.bulkSync
);

router.get(
  "/status",
  auth(),
  validate(syncValidation.getSyncStatus),
  syncController.getSyncStatus
);

export default router;
