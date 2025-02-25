import express from "express";
import tabStashRoutes from "@/modules/tab-stash/tab-stash.routes";

const router = express.Router();

// Use the tab stash module routes
router.use("/", tabStashRoutes);

export default router;
