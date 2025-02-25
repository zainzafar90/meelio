import express from "express";
import breathepodRoutes from "@/modules/breathepod/breathepod.routes";

const router = express.Router();

// Forward all requests to the breathepod module routes
router.use("/", breathepodRoutes);

export default router;
