import { Router } from "express";
import { validate } from "@/common/validate";
import { auth } from "@/modules/auth";
import { pomodoroController, pomodoroValidation } from "@/modules/pomodoro";

const router = Router();

router.get("/", auth(), pomodoroController.getPomodoroSettings);

router.post(
  "/",
  auth(),
  validate(pomodoroValidation.createPomodoroSettings),
  pomodoroController.updatePomodoroSettings
);

router.put(
  "/",
  auth(),
  validate(pomodoroValidation.updatePomodoroSettings),
  pomodoroController.updatePomodoroSettings
);

export default router;
