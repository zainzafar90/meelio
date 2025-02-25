import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { noteController } from "./index";
import { noteValidation } from "./note.validation";

const router = express.Router();

router
  .route("/")
  .get(auth(), noteController.getNotes)
  .post(auth(), validate(noteValidation.createNote), noteController.createNote);

router
  .route("/:id")
  .get(auth(), noteController.getNote)
  .patch(auth(), validate(noteValidation.updateNote), noteController.updateNote)
  .delete(auth(), noteController.deleteNote);

export default router;
