import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { tabStashController } from "./index";
import { tabStashValidation } from "./tab-stash.validation";

const router = express.Router();

router
  .route("/")
  .get(auth(), tabStashController.getTabStashes)
  .post(
    auth(),
    validate(tabStashValidation.createTabStash),
    tabStashController.createTabStash
  );

router
  .route("/:id")
  .get(auth(), tabStashController.getTabStash)
  .patch(
    auth(),
    validate(tabStashValidation.updateTabStash),
    tabStashController.updateTabStash
  )
  .delete(auth(), tabStashController.deleteTabStash);

export default router;
