import express from "express";
import noteRoutes from "@/modules/note/note.routes";

const router = express.Router();

// Use the note module routes
router.use("/", noteRoutes);

export default router;
