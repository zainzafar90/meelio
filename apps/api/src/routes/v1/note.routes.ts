import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { noteController } from "@/modules/note/index";
import { noteValidation } from "@/modules/note/note.validation";
import requirePro from "@/modules/auth/requirePro.middleware";

const router = express.Router();

router
  .route("/")
  .get(auth(), requirePro(), noteController.getNotes)
  .post(auth(), requirePro(), validate(noteValidation.createNote), noteController.createNote);

router
  .route("/:id")
  .get(auth(), requirePro(), noteController.getNote)
  .patch(auth(), requirePro(), validate(noteValidation.updateNote), noteController.updateNote)
  .delete(auth(), requirePro(), noteController.deleteNote);

router.post(
  "/bulk",
  auth(),
  requirePro(),
  validate(noteValidation.bulkSync),
  noteController.bulkSync
);

export default router;
