import express from "express";

import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import {
  calendarTokenController,
  calendarTokenValidation,
} from "@/modules/calendar-token";

const router = express.Router();

router
  .route("/")
  .post(
    auth(),
    validate(calendarTokenValidation.saveToken),
    calendarTokenController.saveToken,
  )
  .delete(auth(), calendarTokenController.deleteToken);

export default router;
