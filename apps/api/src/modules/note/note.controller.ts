import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import * as noteService from "./note.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

/**
 * Get notes for the authenticated user
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getNotes = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const notes = await noteService.getNotes(userId);
    return res.status(httpStatus.OK).json(notes);
  }
);

/**
 * Get a note by ID
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getNote = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const note = await noteService.getNoteById(id, userId);
    return res.status(httpStatus.OK).json(note);
  }
);

/**
 * Create a note
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const createNote = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const note = await noteService.createNote(userId, req.body);
    return res.status(httpStatus.CREATED).json(note);
  }
);

/**
 * Update a note
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const updateNote = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const note = await noteService.updateNote(id, userId, req.body);
    return res.status(httpStatus.OK).json(note);
  }
);

/**
 * Delete a note
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const deleteNote = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    await noteService.deleteNote(id, userId);
    return res.status(httpStatus.NO_CONTENT).send();
  }
);
