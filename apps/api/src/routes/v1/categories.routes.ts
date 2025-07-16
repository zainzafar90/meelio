import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { categoriesController } from "@/modules/categories/categories.controller";
import { categoriesValidation } from "@/modules/categories/categories.validation";

const router = express.Router();

router
  .route("/")
  .get(auth(), categoriesController.getCategories)
  .post(auth(), validate(categoriesValidation.createCategory), categoriesController.createCategory);

router
  .route("/:id")
  .get(auth(), categoriesController.getCategory)
  .patch(auth(), validate(categoriesValidation.updateCategory), categoriesController.updateCategory)
  .delete(auth(), categoriesController.deleteCategory);

export default router;