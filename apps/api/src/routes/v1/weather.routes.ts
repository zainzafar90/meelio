import { Router } from "express";
import auth from "@/modules/auth/auth.middleware";
import requirePro from "@/modules/auth/requirePro.middleware";
import { weatherController } from "@/modules/weather";

const router = Router();

router.get("/", auth(), weatherController.getWeather);
router.get("/forecast", auth(), weatherController.getForecast);
router.get("/locations/search", auth(), weatherController.searchLocations);

export default router;

