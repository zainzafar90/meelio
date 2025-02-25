import express from "express";
import siteBlockerRoutes from "@/modules/site-blocker/site-blocker.routes";

const router = express.Router();

// Use the site blocker module routes
router.use("/", siteBlockerRoutes);

export default router;
