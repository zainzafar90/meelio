import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import * as breathepodController from "./breathepod.controller";
import { breathepodValidation } from "./breathepod.validation";

const router = express.Router();

router
  .route("/")
  .get(auth(), breathepodController.getBreathepod)
  .put(
    auth(),
    validate(breathepodValidation.updateBreathepod),
    breathepodController.updateBreathepod
  );

export default router;
