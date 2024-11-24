import { create } from "zustand";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  listId: string;
  assignees?: {
    name: string;
    image?: string;
  }[];
}

export interface List {
  id: string;
  name: string;
  icon?: string;
  emoji: string;
  type: "system" | "custom";
  count?: number;
}

const initialLists: List[] = [
  {
    id: "all",
    name: "All Tasks",
    icon: "ListTodo",
    emoji: "📋",
    type: "system",
  },
  { id: "home", name: "Home", icon: "Home", emoji: "🏠", type: "system" },
  {
    id: "completed",
    name: "Completed",
    icon: "CheckSquare",
    emoji: "✅",
    type: "system",
  },
  { id: "today", name: "Today", icon: "Calendar", emoji: "📅", type: "system" },
  {
    id: "personal",
    name: "Personal",
    icon: "User",
    emoji: "👤",
    type: "system",
  },
  { id: "work", name: "Work", icon: "Briefcase", emoji: "💼", type: "system" },
];

interface TodoState {
  isVisible: boolean;
  lists: List[];
  tasks: Task[];
  activeListId: string;
  setIsVisible: (isVisible: boolean) => void;
  addTask: (task: Task) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  addList: (list: List) => void;
  deleteList: (listId: string) => void;
  setActiveList: (listId: string) => void;
  updateListEmoji: (listId: string, emoji: string) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
  isVisible: false,
  lists: initialLists,
  tasks: [],
  activeListId: "home",
  setIsVisible: (isVisible) => set({ isVisible }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  toggleTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  deleteList: (listId) =>
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== listId),
      tasks: state.tasks.filter((task) => task.listId !== listId),
    })),
  setActiveList: (listId) => set({ activeListId: listId }),
  updateListEmoji: (listId, emoji) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, emoji } : list
      ),
    })),
}));
