import express, { Router } from "express";
import { weatherController } from "../../modules/weather/weather.controller";
import { weatherValidation } from "../../modules/weather/weather.validation";
import { validate } from "../../modules/validate";

const router: Router = express.Router();

router.get(
  "/",
  validate(weatherValidation.getWeather),
  weatherController.getCurrentWeather
);

export default router;
