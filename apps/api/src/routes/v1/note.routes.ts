import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { noteController } from "@/modules/note/index";
import { noteValidation } from "@/modules/note/note.validation";
import requirePro from "@/modules/auth/requirePro.middleware";

const router = express.Router();

// Get all notes for sync
router.get("/", auth(), requirePro(), noteController.getNotes);

// Bulk sync endpoint
router.post(
  "/bulk",
  auth(),
  requirePro(),
  validate(noteValidation.bulkSync),
  noteController.bulkSync
);

export default router;
