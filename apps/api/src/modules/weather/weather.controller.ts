import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import { weatherService } from "./weather.service";

export const weatherController = {
  getCurrentWeather: catchAsync(async (req: Request, res: Response) => {
    const locationId = req.query.locationId as string;
    const weather = await weatherService.getCurrentWeather(locationId);
    res.status(httpStatus.OK).send(weather);
  }),
};
