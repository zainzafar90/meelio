import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { noteService } from "./note.service";
import { IUser } from "@/types/interfaces/resources";

export const noteController = {
  /**
   * Get all notes for the authenticated user (for full sync)
   */
  getNotes: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const notes = await noteService.getNotes(user.id);
    return res.status(httpStatus.OK).json(notes);
  }),

  /**
   * Bulk sync operation - handles creates, updates, and deletes
   */
  bulkSync: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { creates = [], updates = [], deletes = [] } = req.body || {};
    const result = await noteService.bulkSync(user.id, { creates, updates, deletes });
    return res.status(httpStatus.OK).json(result);
  }),
};
