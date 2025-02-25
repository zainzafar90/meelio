import express from "express";
import focusSessionRoutes from "@/modules/focus-session/focus-session.routes";

const router = express.Router();

// Use the focus session module routes
router.use("/", focusSessionRoutes);

export default router;
