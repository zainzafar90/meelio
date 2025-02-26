import { Router } from "express";
import { auth } from "@/modules/auth";
import {
  backgroundController,
  backgroundValidation,
} from "@/modules/background";
import { validate } from "@/common/validate";

const router = Router();

router.get("/", auth(), backgroundController.getBackgrounds);

router.get("/random", auth(), backgroundController.getRandomBackground);

router.post(
  "/selected",
  auth(),
  validate(backgroundValidation.setSelectedBackground),
  backgroundController.setSelectedBackground
);

router.get(
  "/:id",
  auth(),
  validate(backgroundValidation.getBackground),
  backgroundController.getBackgroundById
);

router.post(
  "/",
  auth(),
  validate(backgroundValidation.createBackground),
  backgroundController.createBackground
);

router.put(
  "/:id",
  auth(),
  validate(backgroundValidation.updateBackground),
  backgroundController.updateBackground
);

router.delete(
  "/:id",
  auth(),
  validate(backgroundValidation.deleteBackground),
  backgroundController.deleteBackground
);

export default router;
