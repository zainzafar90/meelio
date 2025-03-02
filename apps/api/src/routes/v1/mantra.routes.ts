import { Router } from "express";
import { mantraController } from "@/modules/mantra";
import { mantraValidation } from "@/modules/mantra";
import { auth } from "@/modules/auth";
import { validate } from "@/common/validate";

const router = Router();

router
  .route("/")
  .get(auth(), mantraController.getMantras)
  .post(
    auth(),
    validate(mantraValidation.createMantra),
    mantraController.createMantra
  );

router
  .route("/:id")
  .get(auth(), mantraController.getMantra)
  .patch(
    auth(),
    validate(mantraValidation.updateMantra),
    mantraController.updateMantra
  )
  .delete(auth(), mantraController.deleteMantra);

export default router;
