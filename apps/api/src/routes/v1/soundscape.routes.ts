import { Router } from "express";
import { soundscapesController } from "@/modules/soundscapes";
import { soundscapesValidation } from "@/modules/soundscapes";
import { auth } from "@/modules/auth";
import { validate } from "@/common/validate";

const router = Router();

router
  .route("/")
  .get(auth(), soundscapesController.getSoundscapes)
  .post(
    auth(),
    validate(soundscapesValidation.createSoundscape),
    soundscapesController.createSoundscape
  );

router
  .route("/:id")
  .get(auth(), soundscapesController.getSoundscape)
  .patch(
    auth(),
    validate(soundscapesValidation.updateSoundscape),
    soundscapesController.updateSoundscape
  )
  .delete(auth(), soundscapesController.deleteSoundscape);

export default router;
