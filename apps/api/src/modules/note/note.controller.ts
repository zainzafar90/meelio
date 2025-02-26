import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { noteService } from "./note.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export const noteController = {
  getNotes: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const notes = await noteService.getNotes(userId);
    return res.status(httpStatus.OK).json(notes);
  }),

  getNote: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const note = await noteService.getNoteById(id, userId);
    return res.status(httpStatus.OK).json(note);
  }),

  createNote: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const note = await noteService.createNote(userId, req.body);
    return res.status(httpStatus.CREATED).json(note);
  }),

  updateNote: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const note = await noteService.updateNote(id, userId, req.body);
    return res.status(httpStatus.OK).json(note);
  }),

  deleteNote: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    await noteService.deleteNote(id, userId);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};
