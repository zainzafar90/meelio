import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { noteService } from "./note.service";
import { IUser } from "@/types/interfaces/resources";

export const noteController = {
  getNotes: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const notes = await noteService.getNotes(user.id);
    return res.status(httpStatus.OK).json(notes);
  }),

  getNote: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;

    const note = await noteService.getNoteById(id, user.id);
    return res.status(httpStatus.OK).json(note);
  }),

  createNote: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const note = await noteService.createNote(user.id, req.body);
    return res.status(httpStatus.CREATED).json(note);
  }),

  updateNote: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const { id } = req.params;
    const note = await noteService.updateNote(id, user.id, req.body);
    return res.status(httpStatus.OK).json(note);
  }),

  deleteNote: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const { id } = req.params;
    await noteService.deleteNote(id, user.id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),

  bulkSync: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { creates = [], updates = [], deletes = [] } = req.body || {};
    const result = await noteService.bulkSync(user.id, { creates, updates, deletes });
    return res.status(httpStatus.OK).json(result);
  }),
};
