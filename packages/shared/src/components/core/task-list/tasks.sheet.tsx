import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";

import { useDockStore } from "../../../stores/dock.store";
import { useTaskStore } from "../../../stores/task.store";
import { useSyncStore } from "../../../stores/sync.store";
import { useAuthStore } from "../../../stores/auth.store";

import { CreateTask } from "./components/create-task";
import { TaskList } from "./components/task-list";
import { SyncStatus } from "../../sync-status";
import { CreateList } from "./components/create-list";
import { Plus } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

export function TaskListSheet() {
  const { t } = useTranslation();
  const { isTasksVisible, setTasksVisible } = useDockStore(
    useShallow((state) => ({
      isTasksVisible: state.isTasksVisible,
      setTasksVisible: state.setTasksVisible,
    }))
  );
  const {
    lists,
    tasks,
    activeListId,
    setActiveList,
    initializeStore,
    isLoading,
    error,
  } = useTaskStore(
    useShallow((state) => ({
      lists: state.lists,
      tasks: state.tasks,
      activeListId: state.activeListId,
      setActiveList: state.setActiveList,
      initializeStore: state.initializeStore,
      isLoading: state.isLoading,
      error: state.error,
    }))
  );

  const { user, guestUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
    }))
  );

  const isGuest = !user && !!guestUser;

  const syncStore = useSyncStore();
  const isOnline = syncStore.isOnline;
  const syncErrors =
    syncStore.queues.task?.filter((op) => op.retries >= 3) || [];

  useEffect(() => {
    if (isTasksVisible) {
      initializeStore();
    }
  }, [isTasksVisible, initializeStore]);

  const activeList = lists.find((list) => list.id === activeListId);

  const filteredTasks = tasks.filter((task) => {
    if (!activeListId || activeListId === "all") return true;
    if (activeListId === "completed") return task.completed;
    if (activeListId === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (task.createdAt || task.dueDate) {
        try {
          const dueDate = new Date(task.dueDate || task.createdAt);
          dueDate.setHours(0, 0, 0, 0);
          const isToday = dueDate.getTime() === today.getTime();
          
          return isToday;
        } catch (error) {
          console.warn("Invalid dueDate for task:", task.id, task.dueDate);
          return false;
        }
      }
      
      return false;
    }
    
    // If it's not a system list, it's a category - filter by categoryId
    return task.categoryId === activeListId;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <Sheet open={isTasksVisible} onOpenChange={setTasksVisible}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <SheetHeader className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <SheetTitle>{t("tasks.sheet.title")}</SheetTitle>
            <SyncStatus entityType="task" />
          </div>
          <SheetDescription>
            <span className="mb-2 block">{t("tasks.sheet.description")}</span>
          </SheetDescription>
        </SheetHeader>

        <main className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {!isOnline && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-md text-sm">
              You're offline. Changes will sync when you're back online.
            </div>
          )}

          {isGuest && (
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-md text-sm">
              <p className="font-medium">Guest mode</p>
              <p className="mt-1">
                Your tasks are saved locally. Sign in to sync across devices.
              </p>
            </div>
          )}

          {syncErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
              Some tasks failed to sync. They'll retry automatically.
            </div>
          )}

          <div className="flex items-center gap-2">
            <Select
              value={activeListId || "all"}
              onValueChange={(value) => setActiveList(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    {activeList?.emoji && <span>{activeList.emoji}</span>}
                    <span>{activeList?.name || "All Tasks"}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    <span className="flex items-center gap-2">
                      {list.emoji && <span>{list.emoji}</span>}
                      <span>{list.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CreateList>
              <Button variant="ghost" size="icon" title={t("tasks.list.create.title")}>
                <Plus className="h-4 w-4" />
              </Button>
            </CreateList>
          </div>

          <div className="space-y-8">
            <TaskList
              activeListId={activeListId || "all"}
              tasks={sortedTasks}
              isLoading={isLoading}
            />
          </div>
        </main>

        <SheetFooter className="border-t p-4">
          <CreateTask />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
