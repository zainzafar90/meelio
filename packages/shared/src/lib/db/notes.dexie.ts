import { db } from "./meelio.dexie";
import { Note } from "./models.dexie";

export interface CreateNote extends Omit<Note, "createdAt" | "updatedAt"> {}
export type UpdateNote = Partial<
  Omit<Note, "id" | "createdAt" | "updatedAt">
>;

export const getAllNotes = async (): Promise<Note[]> => {
  return db.notes.toArray();
};

export const addNote = async (note: CreateNote): Promise<string> => {
  return db.notes.add({
    ...note,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

export const updateNote = async (
  id: string,
  updates: UpdateNote
): Promise<number> => {
  return db.notes.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteNote = async (id: string): Promise<void> => {
  await db.notes.delete(id);
};
