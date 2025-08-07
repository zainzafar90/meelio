import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { tabStashController } from "@/modules/tab-stash";
import { tabStashValidation } from "@/modules/tab-stash/tab-stash.validation";

const router = express.Router();

router
  .route("/")
  .get(auth(), tabStashController.getTabStashes)
  .post(
    auth(),
    validate(tabStashValidation.createTabStash),
    tabStashController.createTabStash
  );

router.post("/bulk", auth(), tabStashController.bulkSync);

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
