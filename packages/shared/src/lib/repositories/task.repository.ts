import { apiClient } from "../api/client";
import type { Task } from "../db/models.dexie";

export interface TaskFilters {
  completed?: boolean;
  category?: string;
  dueDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const taskRepository = {
  /**
   * Get all tasks with optional filters
   */
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    
    if (filters?.completed !== undefined) {
      params.append("completed", String(filters.completed));
    }
    if (filters?.category) {
      params.append("category", filters.category);
    }
    if (filters?.dueDate) {
      params.append("dueDate", filters.dueDate);
    }
    if (filters?.sortBy) {
      params.append("sortBy", filters.sortBy);
    }
    if (filters?.sortOrder) {
      params.append("sortOrder", filters.sortOrder);
    }
    
    const response = await apiClient.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string): Promise<Task> {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Get all task categories
   */
  async getCategories(): Promise<string[]> {
    const response = await apiClient.get("/tasks/categories");
    return response.data;
  },

  /**
   * Create a new task
   */
  async createTask(task: Partial<Task>): Promise<Task> {
    const response = await apiClient.post("/tasks", task);
    return response.data;
  },

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${taskId}`, updates);
    return response.data;
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  /**
   * Delete all tasks in a category
   */
  async deleteTasksByCategory(category: string): Promise<void> {
    await apiClient.delete(`/tasks/category/${category}`);
  },

  /**
   * Toggle task completion status
   */
  async toggleTaskComplete(taskId: string, completed: boolean): Promise<Task> {
    return this.updateTask(taskId, { completed });
  },
};