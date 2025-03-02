import express, { Router } from "express";

import { validate } from "@/common/validate";
import { auth } from "@/modules/auth";
import { accountController } from "@/modules/auth/auth.controller";
import { accountValidation } from "@/modules/auth/auth.validation";

const router: Router = express.Router();

router.post(
  "/register",
  validate(accountValidation.register),
  accountController.register
);
router.post(
  "/login",
  validate(accountValidation.login),
  accountController.login
);
// router.post(
//   "/guest",
//   validate(accountValidation.registerGuest),
//   accountController.registerGuest
// );
router.post(
  "/forgot-password",
  validate(accountValidation.forgotPassword),
  accountController.forgotPassword
);
router.post(
  "/reset-password",
  validate(accountValidation.resetPassword),
  accountController.resetPassword
);
router.post(
  "/send-verification-email",
  auth(),
  accountController.sendVerificationEmail
);
router.post(
  "/verify-email",
  validate(accountValidation.verifyEmail),
  accountController.verifyEmail
);
router.post(
  "/send-magic-link",
  validate(accountValidation.magicLinkEmail),
  accountController.sendMagicLinkEmail
);
router.post(
  "/verify-magic-link",
  validate(accountValidation.verifyMagicLink),
  accountController.verifyMagicLinkEmail
);

router.get("/google", accountController.googleAuth);
router.get("/callback/google", accountController.googleAuthCallback);
router.get("/google/success", accountController.googleAuthCallbackSuccess);
router.get("/google/failure", accountController.googleAuthCallbackFailure);

router.get("/", auth(), accountController.getAccount);
router.put(
  "/",
  auth(),
  validate(accountValidation.updateAccountBody),
  accountController.updateAccount
);
router.post("/logout", auth(), accountController.logout);

export default router;
