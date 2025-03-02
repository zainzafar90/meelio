import { db } from "./meelio.dexie";
import { Task, TodoList } from "./models.dexie";

export const getAllTasks = async (): Promise<Task[]> => {
  return await db.tasks.toArray();
};

export const getAllLists = async (): Promise<TodoList[]> => {
  return await db.lists.toArray();
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

export const addList = async (
  list: Omit<TodoList, "createdAt" | "updatedAt">
) => {
  return await db.lists.add({
    ...list,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

export const updateList = async (
  id: string,
  updates: Partial<Omit<TodoList, "id" | "createdAt" | "updatedAt">>
) => {
  return await db.lists.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteList = async (id: string) => {
  await db.transaction("rw", db.lists, db.tasks, async () => {
    await db.lists.delete(id);
    await db.tasks.where("listId").equals(id).delete();
  });
};
