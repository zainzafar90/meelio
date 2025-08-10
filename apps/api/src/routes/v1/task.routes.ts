import { Router } from "express";
import { tasksController } from "@/modules/tasks";
import { tasksValidation } from "@/modules/tasks";
import { tasksBulkValidation } from "@/modules/tasks/tasks-bulk.validation";
import { auth } from "@/modules/auth";
import { validate } from "@/common/validate";

const router = Router();

router
  .route("/")
  .get(auth(), tasksController.getTasks)
  .post(
    auth(),
    validate(tasksValidation.createTask),
    tasksController.createTask
  );

router.post(
  "/bulk", 
  auth(), 
  validate(tasksBulkValidation.bulkSync),
  tasksController.bulkSync
);

router
  .route("/:id")
  .get(auth(), tasksController.getTask)
  .patch(
    auth(),
    validate(tasksValidation.updateTask),
    tasksController.updateTask
  )
  .delete(auth(), tasksController.deleteTask);

export default router;