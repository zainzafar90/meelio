import { Router } from "express";
import { tasksController } from "@/modules/tasks";
import { tasksValidation } from "@/modules/tasks/tasks.validation";
import { auth } from "@/modules/auth";
import { validate } from "@/common/validate";

const router = Router();

// Get all tasks for sync
router.get("/", auth(), tasksController.getTasks);

// Bulk sync endpoint
router.post(
  "/bulk", 
  auth(), 
  validate(tasksValidation.bulkSync),
  tasksController.bulkSync
);

export default router;