import { axios } from "./axios";
import type { Note } from "../lib/db/models.notes";
import { useAuthStore } from "../stores/auth.store";

function checkPro() {
  const isPro = useAuthStore.getState().user?.isPro;
  if (!isPro) throw new Error("Pro subscription required");
}

export interface CreateNoteDto {
  title: string;
  content?: string | null;
  categoryId?: string | null;
  providerId?: string | null;
  updatedAt?: number;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string | null;
  categoryId?: string | null;
  providerId?: string | null;
  updatedAt?: number;
  deletedAt?: number | null;
}

export const noteApi = {
  async getNotes(): Promise<Note[]> {
    checkPro();
    const res = await axios.get("/v1/notes");
    return res.data;
  },
  async createNote(payload: CreateNoteDto): Promise<Note> {
    checkPro();
    const res = await axios.post("/v1/notes", payload);
    return res.data;
  },
  async updateNote(id: string, payload: UpdateNoteDto): Promise<Note> {
    checkPro();
    const res = await axios.patch(`/v1/notes/${id}`, payload);
    return res.data;
  },
  async deleteNote(id: string): Promise<void> {
    checkPro();
    await axios.delete(`/v1/notes/${id}`);
  },
  async bulkSync(payload: {
    creates?: Array<{ clientId?: string } & CreateNoteDto>;
    updates?: Array<{ id?: string; clientId?: string } & UpdateNoteDto>;
    deletes?: Array<{ id?: string; clientId?: string; deletedAt?: number }>;
  }): Promise<{
    created: Array<(Note & { clientId?: string })>;
    updated: Note[];
    deleted: string[];
  }> {
    checkPro();
    const res = await axios.post("/v1/notes/bulk", payload);
    return res.data;
  },
};

