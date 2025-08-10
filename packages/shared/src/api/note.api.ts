import { axios } from "./axios";
import type { Note } from "../lib/db/models.notes";
import { useAuthStore } from "../stores/auth.store";

function checkPro() {
  const isPro = useAuthStore.getState().user?.isPro;
  if (!isPro) throw new Error("Pro subscription required");
}

export const noteApi = {
  /**
   * Get all notes for full sync
   */
  async getNotes(): Promise<Note[]> {
    checkPro();
    const res = await axios.get("/v1/notes");
    return res.data;
  },

  /**
   * Bulk sync operation - handles creates, updates, and deletes
   */
  async bulkSync(payload: {
    creates?: Array<{ 
      clientId?: string;
      title: string;
      content?: string | null;
      categoryId?: string | null;
      providerId?: string | null;
      updatedAt?: number;
    }>;
    updates?: Array<{ 
      id?: string; 
      clientId?: string;
      title?: string;
      content?: string | null;
      categoryId?: string | null;
      providerId?: string | null;
      updatedAt?: number;
      deletedAt?: number | null;
    }>;
    deletes?: Array<{ 
      id?: string; 
      clientId?: string; 
      deletedAt?: number;
    }>;
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

