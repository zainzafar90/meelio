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
import { useTodoStore } from "../../../stores/todo.store";

import { CreateTask } from "./components/create-task";
import { TaskList } from "./components/task-list";

export function TodoListSheet() {
  const { t } = useTranslation();
  const { isTodosVisible, setTodosVisible } = useDockStore(
    useShallow((state) => ({
      isTodosVisible: state.isTodosVisible,
      setTodosVisible: state.setTodosVisible,
    }))
  );
  const { categories, tasks, activeCategory, setActiveCategory, initializeStore, isLoading, error } = useTodoStore(
    useShallow((state) => ({
      categories: state.categories,
      tasks: state.tasks,
      activeCategory: state.activeCategory,
      setActiveCategory: state.setActiveCategory,
      initializeStore: state.initializeStore,
      isLoading: state.isLoading,
      error: state.error,
    }))
  );

  useEffect(() => {
    if (isTodosVisible) {
      initializeStore();
    }
  }, [isTodosVisible, initializeStore]);

  const filteredTasks = tasks.filter((task) => {
    if (!activeCategory || activeCategory === "all") return true;
    if (activeCategory === "completed") return task.completed;
    return task.category === activeCategory;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <Sheet open={isTodosVisible} onOpenChange={setTodosVisible}>
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
            <SheetTitle>{t("todo.sheet.title")}</SheetTitle>
          </div>
          <SheetDescription>
            <span className="mb-2 block">{t("todo.sheet.description")}</span>
          </SheetDescription>
        </SheetHeader>

        <main className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Select
              value={activeCategory || "all"}
              onValueChange={(value) => setActiveCategory(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span>{activeCategory || "All Tasks"}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span>All Tasks</span>
                </SelectItem>
                <SelectItem value="completed">
                  <span>Completed</span>
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    <span>{category}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-8">
            <TaskList
              activeListId={activeCategory || "all"}
              title={activeCategory || "All Tasks"}
              tasks={sortedTasks}
              count={sortedTasks.length}
              icon={undefined}
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
