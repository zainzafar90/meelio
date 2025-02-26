import express from "express";
import { validate } from "@/common/validate";
import auth from "@/modules/auth/auth.middleware";
import { weatherCacheController } from "@/modules/weather-cache";
import { weatherCacheValidation } from "@/modules/weather-cache/weather-cache.validation";

const router = express.Router();

router
  .route("/")
  .get(auth(), weatherCacheController.getWeatherCache)
  .post(
    auth(),
    validate(weatherCacheValidation.updateWeatherCache),
    weatherCacheController.updateWeatherCache
  )
  .put(
    auth(),
    validate(weatherCacheValidation.updateWeatherCache),
    weatherCacheController.updateWeatherCache
  );

export default router;
