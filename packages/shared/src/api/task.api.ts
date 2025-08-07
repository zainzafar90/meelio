import { axios } from "./axios";
import { Task } from "../lib/db/models.dexie";

export interface CreateTaskDto {
  title: string;
  completed?: boolean;
  dueDate?: string;
  pinned?: boolean;
  categoryId?: string;
  providerId?: string;
  updatedAt?: number;
}

export interface UpdateTaskDto {
  title?: string;
  completed?: boolean;
  dueDate?: string;
  pinned?: boolean;
  categoryId?: string;
  providerId?: string;
  updatedAt?: number;
  deletedAt?: number | null;
}

export const taskApi = {
  // Get all tasks
  async getTasks(): Promise<Task[]> {
    const response = await axios.get("/v1/tasks");
    return response.data;
  },


  // Create a new task
  async createTask(task: CreateTaskDto): Promise<Task> {
    const response = await axios.post("/v1/tasks", task);
    return response.data;
  },

  // Update a task
  async updateTask(id: string, updates: UpdateTaskDto): Promise<Task> {
    const response = await axios.patch(`/v1/tasks/${id}`, updates);
    return response.data;
  },

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    await axios.delete(`/v1/tasks/${id}`);
  }
};