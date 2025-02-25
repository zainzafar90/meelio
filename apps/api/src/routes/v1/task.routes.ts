import express from "express";
import { TaskController } from "@/controllers/task.controller";
import auth from "@/modules/auth/auth.middleware";

const router = express.Router();
const taskController = new TaskController();

router
  .route("/")
  .get(auth(), taskController.getTasks.bind(taskController))
  .post(auth(), taskController.createTask.bind(taskController));

router
  .route("/focus")
  .get(auth(), taskController.getFocusTask.bind(taskController));

router
  .route("/:id")
  .get(auth(), taskController.getTask.bind(taskController))
  .patch(auth(), taskController.updateTask.bind(taskController))
  .delete(auth(), taskController.deleteTask.bind(taskController));

export default router;
