import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { weatherService } from "./weather.service";

export const weatherController = {
  getWeather: catchAsync(async (req: Request, res: Response) => {
    const { locationId } = req.query;

    if (!locationId || typeof locationId !== "string") {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: "locationId query parameter is required",
      });
    }

    const weather = await weatherService.getCurrentWeather(locationId);
    return res.status(httpStatus.OK).json(weather);
  }),

  getForecast: catchAsync(async (req: Request, res: Response) => {
    const { locationId } = req.query;

    if (!locationId || typeof locationId !== "string") {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: "locationId query parameter is required",
      });
    }

    const forecast = await weatherService.getWeatherForecast(locationId);
    return res.status(httpStatus.OK).json(forecast);
  }),
};

