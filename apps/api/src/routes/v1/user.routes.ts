import express, { Router } from "express";

import { validate } from "@/common/validate";
import { auth } from "@/modules/auth";
import { userController, userValidation } from "@/modules/user";

const router: Router = express.Router();

router
  .route("/")
  .post(auth(), validate(userValidation.createUser), userController.createUser)
  .get(auth(), validate(userValidation.getUsers), userController.getUsers);

// router.post(
//   "/guest",
//   validate(userValidation.createGuestUser),
//   userController.createGuestUser
// );

router.post(
  "/:userId/convert-guest",
  auth(),
  validate(userValidation.convertGuestToRegular),
  userController.convertGuestToRegular
);

router.get("/me", auth(), userController.getMe);

router
  .route("/:userId")
  .get(auth(), validate(userValidation.getUser), userController.getUser)
  .patch(auth(), validate(userValidation.updateUser), userController.updateUser)
  .delete(
    auth(),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

export default router;
