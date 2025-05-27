import { Badge } from "@repo/ui/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useTodoStore } from "../../../../stores/todo.store";
import { useShallow } from "zustand/shallow";

import { Task } from "../../../../lib/db/models.dexie";
import { cn } from "../../../../lib";
import { Icons } from "../../../../components/icons";

interface TaskListProps {
  tasks: Task[];
  activeListId: string;
  isLoading?: boolean;
}

export function TaskList({
  tasks,
  activeListId,
  isLoading = false,
}: TaskListProps) {
  const { t } = useTranslation();

  if (isLoading && tasks.length === 0) {
    return (
      <div className="mt-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tasks.length === 0)
    return (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{t("todo.list.empty")}</p>
      </div>
    );

  if (activeListId === "all") {
    const tasksByCategory = tasks.reduce(
      (acc, task) => {
        const category = task.category || "Uncategorized";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(task);
        return acc;
      },
      {} as Record<string, Task[]>
    );

    return (
      <div className="mt-4 space-y-8">
        {Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{category}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {categoryTasks.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {categoryTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mt-2 space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

const TaskItem = ({ task }: { task: Task }) => {
  const { toggleTask, deleteTask } = useTodoStore(
    useShallow((state) => ({
      toggleTask: state.toggleTask,
      deleteTask: state.deleteTask,
    }))
  );

  return (
    <div
      key={task.id}
      onClick={() => toggleTask(task.id)}
      className="group flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted/50"
    >
      <button
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full border-2 border-foreground/50 transition-colors",
          task.completed ? "border-transparent bg-accent" : ""
        )}
      >
        {task.completed ? (
          <Icons.check className="h-3 w-3 text-accent-foreground" />
        ) : (
          <span />
        )}
      </button>
      <div className="flex flex-col gap-1">
        <span
          className={cn(
            "text-sm transition-all duration-200",
            task.completed && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {task.dueDate && (
          <Badge className="uppercase" variant="secondary">
            {new Date(task.dueDate).toLocaleDateString()}
          </Badge>
        )}
        <button
          className="invisible text-muted-foreground group-hover:visible"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this task?")) {
              deleteTask(task.id);
            }
          }}
        >
          <Icons.close className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const TaskSkeleton = () => {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 animate-pulse">
      <div className="h-4 w-4 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
      <div className="h-4 w-4 bg-muted rounded" />
    </div>
  );
};
