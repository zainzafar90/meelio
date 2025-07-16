import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { providerService } from "./provider.service";

export const providerController = {
  getProviders: catchAsync(async (req: Request, res: Response) => {
    const includeDisabled = req.query.includeDisabled === "true";
    const providers = await providerService.getProviders(includeDisabled);
    res.status(httpStatus.OK).json(providers);
  }),

  getProviderById: catchAsync(async (req: Request, res: Response) => {
    const provider = await providerService.getProviderById(req.params.id);
    res.status(httpStatus.OK).json(provider);
  }),

  getProviderByName: catchAsync(async (req: Request, res: Response) => {
    const provider = await providerService.getProviderByName(req.params.name);
    res.status(httpStatus.OK).json(provider);
  }),

  createProvider: catchAsync(async (req: Request, res: Response) => {
    const provider = await providerService.createProvider(req.body);
    res.status(httpStatus.CREATED).json(provider);
  }),

  updateProvider: catchAsync(async (req: Request, res: Response) => {
    const provider = await providerService.updateProvider(req.params.id, req.body);
    res.status(httpStatus.OK).json(provider);
  }),

  deleteProvider: catchAsync(async (req: Request, res: Response) => {
    await providerService.deleteProvider(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
  }),

  toggleProviderStatus: catchAsync(async (req: Request, res: Response) => {
    const { enabled } = req.body;
    const provider = await providerService.toggleProviderStatus(req.params.id, enabled);
    res.status(httpStatus.OK).json(provider);
  }),
};