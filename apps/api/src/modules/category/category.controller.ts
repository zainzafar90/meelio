import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { categoryService } from "./category.service";

export const categoryController = {
  getCategories: catchAsync(async (req: Request, res: Response) => {
    const categories = await categoryService.getCategories();
    res.status(httpStatus.OK).json(categories);
  }),

  getCategoryById: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(httpStatus.OK).json(category);
  }),

  getCategoryByName: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.getCategoryByName(req.params.name);
    res.status(httpStatus.OK).json(category);
  }),

  createCategory: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    res.status(httpStatus.CREATED).json(category);
  }),

  updateCategory: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.status(httpStatus.OK).json(category);
  }),

  deleteCategory: catchAsync(async (req: Request, res: Response) => {
    await categoryService.deleteCategory(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
  }),
};