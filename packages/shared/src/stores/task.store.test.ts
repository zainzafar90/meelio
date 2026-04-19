import { beforeEach, describe, expect, it, vi } from "vitest";

const updateTask = vi.fn();
const addTask = vi.fn();
const launchConfetti = vi.fn();

vi.mock("../lib/db/meelio.dexie", () => ({
  db: {
    tasks: {
      update: updateTask,
      add: addTask,
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
    },
  },
}));

vi.mock("./auth.store", () => ({
  getAuthUserId: vi.fn(() => "user-1"),
  useAuthStore: {
    getState: () => ({
      user: { id: "user-1" },
    }),
  },
}));

vi.mock("./app.store", () => ({
  useAppStore: {
    getState: () => ({
      confettiOnComplete: false,
    }),
  },
}));

vi.mock("./category.store", () => ({
  useCategoryStore: {
    getState: () => ({
      loadCategories: vi.fn(),
      categories: [],
    }),
  },
}));

vi.mock("../utils/confetti.utils", () => ({
  launchConfetti,
}));

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
  },
}));

describe("task store", () => {
  beforeEach(async () => {
    vi.resetModules();
    updateTask.mockReset();
    addTask.mockReset();
    launchConfetti.mockReset();
  });

  it("promotes the next most recent task when a pinned focus task is completed", async () => {
    const { useTaskStore } = await import("./task.store");

    useTaskStore.setState({
      tasks: [
        {
          id: "task-1",
          userId: "user-1",
          title: "Current focus",
          completed: false,
          pinned: true,
          createdAt: 1,
          updatedAt: 100,
          deletedAt: null,
        },
        {
          id: "task-2",
          userId: "user-1",
          title: "Next best candidate",
          completed: false,
          pinned: false,
          createdAt: 2,
          updatedAt: 300,
          deletedAt: null,
        },
        {
          id: "task-3",
          userId: "user-1",
          title: "Older candidate",
          completed: false,
          pinned: false,
          createdAt: 3,
          updatedAt: 200,
          deletedAt: null,
        },
      ],
    });

    await useTaskStore.getState().toggleTask("task-1");

    const tasks = useTaskStore.getState().tasks;
    const completedTask = tasks.find((task) => task.id === "task-1");
    const promotedTask = tasks.find((task) => task.id === "task-2");

    expect(completedTask?.completed).toBe(true);
    expect(completedTask?.pinned).toBe(false);
    expect(promotedTask?.pinned).toBe(true);
    expect(updateTask).toHaveBeenCalledTimes(2);
    expect(updateTask).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({
        completed: true,
        pinned: false,
      }),
    );
    expect(updateTask).toHaveBeenCalledWith(
      "task-2",
      expect.objectContaining({
        pinned: true,
      }),
    );
  });
});
