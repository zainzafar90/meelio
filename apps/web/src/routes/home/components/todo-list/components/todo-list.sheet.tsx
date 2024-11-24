import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTodoStore } from "@/stores/todo.store";

import { CreateList } from "./create-list";
import { CreateTask } from "./create-task";
import { TaskList } from "./task-list";

export const TodoListSheet = () => {
  const { isVisible, setIsVisible, lists, tasks, activeListId, setActiveList } =
    useTodoStore();
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
    <Sheet open={isVisible} onOpenChange={setIsVisible}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        style={{
          //   backgroundImage:
          //     "url(https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <SheetHeader className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <SheetTitle>Tasks</SheetTitle>
          </div>
          <SheetDescription>
            <span className="mb-2 block">
              A list of tasks to help you stay organized and on top of your
              work, projects, and goals.
            </span>
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
                <Plus className="mr-2 h-4 w-4" />
                New List
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
};
