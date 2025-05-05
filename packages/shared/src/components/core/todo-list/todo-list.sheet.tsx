import { Button } from "@repo/ui/components/ui/button";
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
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";

import { useDockStore } from "../../../stores/dock.store";
import { useTodoStore } from "../../../stores/todo.store";
import { cn } from "../../../lib/utils";

import { CreateList } from "./components/create-list";
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
  const { lists, tasks, activeListId, setActiveList } = useTodoStore(
    useShallow((state) => ({
      lists: state.lists,
      tasks: state.tasks,
      activeListId: state.activeListId,
      setActiveList: state.setActiveList,
    }))
  );
  const activeList = lists.find((list) => list.id === activeListId);

  const filteredTasks = tasks.filter((task) => {
    if (activeListId === "all") return true;
    if (activeListId === "completed") return task.completed;
    if (activeListId === "today") return task.date === "Today";
    return task.listId === activeListId;
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
          <div className="flex items-center gap-2">
            <Select
              value={activeListId}
              onValueChange={(value) => setActiveList(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span>{activeList?.emoji}</span>
                    <span>{activeList?.name}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    <span className="flex items-center gap-2">
                      <span>{list.emoji}</span>
                      <span>{list.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CreateList>
              <Button variant="outline">
                <Plus className="h-4 w-4" />
                {t("todo.sheet.add")}
              </Button>
            </CreateList>
          </div>

          <div className="space-y-8">
            <TaskList
              activeListId={activeListId}
              title={activeList?.name || ""}
              tasks={sortedTasks}
              count={sortedTasks.length}
              icon={activeList?.icon}
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
