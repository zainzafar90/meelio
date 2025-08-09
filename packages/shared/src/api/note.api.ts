import type { AxiosInstance } from "axios";
import { Note } from "../lib/db/models.dexie";

/** Input for creating a note. */
export interface CreateNoteDto {
  title: string;
  content: string;
}

/** Fields allowed when updating a note. */
export interface UpdateNoteDto {
  title?: string;
  content?: string;
}

/** Fetch all notes. */
export const getNotes = async (client: AxiosInstance): Promise<Note[]> => {
  const response = await client.get<Note[]>("/v1/notes");
  return response.data;
};

/** Fetch a note by id. */
export const getNote = async (
  client: AxiosInstance,
  id: string,
): Promise<Note> => {
  const response = await client.get<Note>(`/v1/notes/${id}`);
  return response.data;
};

/** Create a note. */
export const createNote = async (
  client: AxiosInstance,
  note: CreateNoteDto,
): Promise<Note> => {
  const response = await client.post<Note>("/v1/notes", note);
  return response.data;
};

/** Update a note. */
export const updateNote = async (
  client: AxiosInstance,
  id: string,
  updates: UpdateNoteDto,
): Promise<Note> => {
  const response = await client.patch<Note>(`/v1/notes/${id}`, updates);
  return response.data;
};

/** Delete a note. */
export const deleteNote = async (
  client: AxiosInstance,
  id: string,
): Promise<void> => {
  await client.delete(`/v1/notes/${id}`);
};
