import { axios } from "./axios";
import { Note } from "../lib/db/models.dexie";

export interface CreateNoteDto {
  title: string;
  content: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
}

export const noteApi = {
  async getNotes(): Promise<Note[]> {
    const response = await axios.get("/v1/notes");
    return response.data;
  },

  async createNote(note: CreateNoteDto): Promise<Note> {
    const response = await axios.post("/v1/notes", note);
    return response.data;
  },

  async updateNote(id: string, updates: UpdateNoteDto): Promise<Note> {
    const response = await axios.patch(`/v1/notes/${id}`, updates);
    return response.data;
  },

  async deleteNote(id: string): Promise<void> {
    await axios.delete(`/v1/notes/${id}`);
  },
};
