import express from "express";
import weatherCacheRoutes from "@/modules/weather-cache/weather-cache.routes";

const router = express.Router();

// Use the weather cache module routes
router.use("/", weatherCacheRoutes);

export default router;
