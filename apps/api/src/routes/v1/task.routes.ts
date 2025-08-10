import { Router } from "express";
import { tasksController } from "@/modules/tasks";
import { tasksBulkValidation } from "@/modules/tasks/tasks-bulk.validation";
import { auth } from "@/modules/auth";
import { validate } from "@/common/validate";

const router = Router();

// Get all tasks for sync
router.get("/", auth(), tasksController.getTasks);

// Bulk sync endpoint
router.post(
  "/bulk", 
  auth(), 
  validate(tasksBulkValidation.bulkSync),
  tasksController.bulkSync
);

export default router;