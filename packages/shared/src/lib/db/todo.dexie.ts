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

export const addTask = async (
  task: Omit<Task, "createdAt" | "updatedAt">
) => {
  if (task.pinned) {
    await db.tasks
      .where({ userId: task.userId, pinned: 1 })
      .modify({ pinned: 0 });
  }
  return await db.tasks.add({
    ...task,
    pinned: task.pinned ?? false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

export const updateTask = async (
  id: string,
  updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
) => {
  if (updates.pinned) {
    const existing = await db.tasks.get(id);
    if (!existing) return 0;
    await db.tasks
      .where({ userId: existing.userId, pinned: 1 })
      .modify({ pinned: 0 });
  }
  return await db.tasks.update(id, {
    ...updates,
    pinned: updates.pinned ?? (await db.tasks.get(id)).pinned,
    updatedAt: Date.now(),
  });
};

export const deleteTask = async (id: string) => {
  return await db.tasks.delete(id);
};

export const deleteTasksByCategory = async (category: string) => {
  return await db.tasks.where("category").equals(category).delete();
};