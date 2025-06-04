import express from "express";
import { auth } from "@/modules/auth";
import { validate } from "@/common/validate";
import * as settingsController from "@/modules/settings/settings.controller";
import * as settingsValidation from "@/modules/settings/settings.validation";

const router = express.Router();

router
  .route("/")
  .patch(
    auth(),
    validate(settingsValidation.updateSettingsSchema),
    settingsController.updateSettings
  );

router
  .route("/pomodoro")
  .patch(auth(), settingsController.updatePomodoroSettings);

router
  .route("/todo")
  .patch(auth(), settingsController.updateTodoSettings);

export default router;