import { Router } from "express";
import { auth } from "@/modules/auth";
import {
  backgroundController,
  backgroundValidation,
} from "@/modules/background";
import { validate } from "@/common/validate";

const router = Router();

router.get("/", auth(), backgroundController.getBackgrounds);

router.post(
  "/selected",
  auth(),
  validate(backgroundValidation.setSelectedBackground),
  backgroundController.setSelectedBackground
);

export default router;
