import { db } from "./meelio.dexie";
import { Task } from "./models.dexie";

export const getAllTasks = async (): Promise<Task[]> => {
  return await db.tasks.toArray();
};

export const getTasksByCategory = async (category: string): Promise<Task[]> => {
  return await db.tasks.where("category").equals(category).toArray();
};

export const getCategories = async (): Promise<string[]> => {
  const tasks = await db.tasks.toArray();
  const categories = tasks
    .map(t => t.category)
    .filter((c): c is string => c !== null && c !== undefined);
  return [...new Set(categories)];
};

export const addTask = async (task: Omit<Task, "createdAt" | "updatedAt">) => {
  return await db.tasks.add({
    ...task,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

export const updateTask = async (
  id: string,
  updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
) => {
  return await db.tasks.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteTask = async (id: string) => {
  return await db.tasks.delete(id);
};

export const deleteTasksByCategory = async (category: string) => {
  return await db.tasks.where("category").equals(category).delete();
};