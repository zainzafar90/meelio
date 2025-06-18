import express from "express";
import { validate } from "@/common/validate";
import { calendarController } from "@/modules/calendar";
import { calendarValidation } from "@/modules/calendar/calendar.validation";
import auth from "@/modules/auth/auth.middleware";

const router = express.Router();

// OAuth flow routes
router.get("/auth", auth(), calendarController.authorize);
router.get("/callback", calendarController.callback);

// Token management routes
router
  .route("/tokens")
  .get(auth(), calendarController.getToken)
  .post(
    auth(),
    validate(calendarValidation.saveToken),
    calendarController.saveToken,
  )
  .delete(auth(), calendarController.deleteToken);

export default router;