import { Router } from "express";
import auth from "@/modules/auth/auth.middleware";
import requirePro from "@/modules/auth/requirePro.middleware";
import { weatherController } from "@/modules/weather";

const router = Router();

router.get("/", auth(), requirePro(), weatherController.getWeather);
router.get("/forecast", auth(), requirePro(), weatherController.getForecast);
router.get("/locations/search", auth(), requirePro(), weatherController.searchLocations);

export default router;

