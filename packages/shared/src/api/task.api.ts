import { axios } from "./axios";
import { Task } from "../lib/db/models.dexie";

export const taskApi = {
  /**
   * Get all tasks for full sync
   */
  async getTasks(): Promise<Task[]> {
    const response = await axios.get("/v1/tasks");
    return response.data;
  },

  /**
   * Bulk sync operation - handles creates, updates, and deletes
   */
  async bulkSync(payload: {
    creates?: Array<{
      clientId?: string;
      title: string;
      completed?: boolean;
      dueDate?: string;
      pinned?: boolean;
      categoryId?: string;
      providerId?: string;
      updatedAt?: number;
    }>;
    updates?: Array<{
      id?: string;
      clientId?: string;
      title?: string;
      completed?: boolean;
      dueDate?: string;
      pinned?: boolean;
      categoryId?: string;
      providerId?: string;
      updatedAt?: number;
      deletedAt?: number | null;
    }>;
    deletes?: Array<{
      id?: string;
      clientId?: string;
      deletedAt?: number;
    }>;
  }): Promise<{
    created: Array<(Task & { clientId?: string })>;
    updated: Task[];
    deleted: string[];
  }> {
    const response = await axios.post(`/v1/tasks/bulk`, payload);
    return response.data;
  },
};