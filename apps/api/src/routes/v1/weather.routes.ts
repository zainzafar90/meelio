import { Router } from "express";
import { weatherController } from "@/modules/weather";

const router = Router();

router.get("/", weatherController.getWeather);
router.get("/forecast", weatherController.getForecast);

export default router;

