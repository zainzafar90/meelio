import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { focusSessionController } from "@/modules/focus-session";
import { focusSessionValidation } from "@/modules/focus-session/focus-session.validation";

const router = express.Router();

router
  .route("/")
  .get(auth(), focusSessionController.getFocusSessions)
  .post(
    auth(),
    validate(focusSessionValidation.createFocusSession),
    focusSessionController.createFocusSession
  );

router
  .route("/:id")
  .get(auth(), focusSessionController.getFocusSession)
  .patch(
    auth(),
    validate(focusSessionValidation.updateFocusSession),
    focusSessionController.updateFocusSession
  )
  .delete(auth(), focusSessionController.deleteFocusSession);

export default router;
