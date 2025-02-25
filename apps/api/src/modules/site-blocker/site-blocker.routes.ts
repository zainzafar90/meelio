import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { siteBlockerController } from "./index";
import { siteBlockerValidation } from "./site-blocker.validation";

const router = express.Router();

router
  .route("/")
  .get(auth(), siteBlockerController.getSiteBlockers)
  .post(
    auth(),
    validate(siteBlockerValidation.createSiteBlocker),
    siteBlockerController.createSiteBlocker
  );

router
  .route("/:siteBlockerId")
  .get(auth(), siteBlockerController.getSiteBlocker)
  .patch(
    auth(),
    validate(siteBlockerValidation.updateSiteBlocker),
    siteBlockerController.updateSiteBlocker
  )
  .delete(auth(), siteBlockerController.deleteSiteBlocker);

export default router;
