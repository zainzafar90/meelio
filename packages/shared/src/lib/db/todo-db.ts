import Dexie, { Table } from "dexie";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  listId: string;
  createdAt: number;
  updatedAt: number;
  assignees?: {
    name: string;
    image?: string;
  }[];
}

export interface TodoList {
  id: string;
  name: string;
  icon?: string;
  emoji: string;
  type: "system" | "custom";
  createdAt: number;
  updatedAt: number;
}

const initialLists: TodoList[] = [
  {
    id: "all",
    name: "All Tasks",
    icon: "ListTodo",
    emoji: "📋",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "completed",
    name: "Completed",
    icon: "CheckSquare",
    emoji: "✅",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "today",
    name: "Today",
    icon: "Calendar",
    emoji: "📅",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "personal",
    name: "Personal",
    icon: "User",
    emoji: "👤",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "work",
    name: "Work",
    icon: "Briefcase",
    emoji: "💼",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export class TodoDB extends Dexie {
  tasks!: Table<Task>;
  lists!: Table<TodoList>;

  constructor() {
    super("todo-db");
    this.version(1).stores({
      tasks: "id, listId, completed, date, createdAt, updatedAt",
      lists: "id, type, createdAt, updatedAt",
    });

    this.on("populate", () => {
      this.lists.bulkAdd(initialLists);
    });
  }
}

const todoDB = new TodoDB();

// Helper functions
export const syncTasks = async (tasks: Task[]) => {
  return await todoDB.tasks.bulkPut(
    tasks.map((task) => ({
      ...task,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }))
  );
};

export const syncLists = async (lists: TodoList[]) => {
  return await todoDB.lists.bulkPut(
    lists.map((list) => ({
      ...list,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }))
  );
};

export const getAllTasks = async (): Promise<Task[]> => {
  return await todoDB.tasks.toArray();
};

export const getAllLists = async (): Promise<TodoList[]> => {
  return await todoDB.lists.toArray();
};

export const addTask = async (task: Omit<Task, "createdAt" | "updatedAt">) => {
  return await todoDB.tasks.add({
    ...task,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

export const updateTask = async (
  id: string,
  updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
) => {
  return await todoDB.tasks.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteTask = async (id: string) => {
  return await todoDB.tasks.delete(id);
};

export const addList = async (
  list: Omit<TodoList, "createdAt" | "updatedAt">
) => {
  return await todoDB.lists.add({
    ...list,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

export const updateList = async (
  id: string,
  updates: Partial<Omit<TodoList, "id" | "createdAt" | "updatedAt">>
) => {
  return await todoDB.lists.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteList = async (id: string) => {
  // Delete the list and all its tasks
  await todoDB.transaction("rw", todoDB.lists, todoDB.tasks, async () => {
    await todoDB.lists.delete(id);
    await todoDB.tasks.where("listId").equals(id).delete();
  });
};

// Query helpers
export const getTasksByList = async (listId: string): Promise<Task[]> => {
  return await todoDB.tasks.where("listId").equals(listId).toArray();
};

export const getCompletedTasks = async (): Promise<Task[]> => {
  return await todoDB.tasks.where("completed").equals("true").toArray();
};

export const getTodaysTasks = async (): Promise<Task[]> => {
  return await todoDB.tasks.where("date").equals("Today").toArray();
};

export const getCustomLists = async (): Promise<TodoList[]> => {
  return await todoDB.lists.where("type").equals("custom").toArray();
};

export const getSystemLists = async (): Promise<TodoList[]> => {
  return await todoDB.lists.where("type").equals("system").toArray();
};

// Add a function to ensure system lists exist
export const ensureSystemLists = async () => {
  const existingLists = await todoDB.lists
    .where("type")
    .equals("system")
    .toArray();
  const existingListIds = existingLists.map((list) => list.id);

  const missingLists = initialLists.filter(
    (list) => !existingListIds.includes(list.id)
  );

  if (missingLists.length > 0) {
    await todoDB.lists.bulkAdd(missingLists);
  }
};

// Call this when initializing the app
ensureSystemLists();
