import { Request, Response } from "express";
import httpStatus from "http-status";
import { IUser } from "@/types/interfaces/resources";
import { categoriesService } from "./categories.service";
import { catchAsync } from "@/utils/catch-async";

export const categoriesController = {
  /**
   * Get all categories for the authenticated user
   */
  getCategories: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const categories = await categoriesService.getCategories(user.id);
    return res.status(httpStatus.OK).json(categories);
  }),

  /**
   * Get a specific category
   */
  getCategory: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const category = await categoriesService.getCategoryById(user.id, id);
    return res.status(httpStatus.OK).json(category);
  }),

  /**
   * Create a new category
   */
  createCategory: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { name } = req.body;
    const category = await categoriesService.createCategory(user.id, name);
    return res.status(httpStatus.CREATED).json(category);
  }),

  /**
   * Update a category
   */
  updateCategory: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const { name } = req.body;
    const category = await categoriesService.updateCategory(user.id, id, name);
    return res.status(httpStatus.OK).json(category);
  }),

  /**
   * Delete a category
   */
  deleteCategory: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    await categoriesService.deleteCategory(user.id, id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};