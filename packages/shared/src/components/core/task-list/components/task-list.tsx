import { Badge } from "@repo/ui/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useTaskStore } from "../../../../stores/task.store";
import { useShallow } from "zustand/shallow";

import { Task } from "../../../../lib/db/models.dexie";
import { cn } from "../../../../lib";
import { Icons } from "../../../../components/icons";
import { CategoryBadge } from "./category-badge";

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
        <p className="text-sm text-muted-foreground">{t("tasks.list.empty")}</p>
      </div>
    );


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
  const { toggleTask, deleteTask, togglePinTask } = useTaskStore(
    useShallow((state) => ({
      toggleTask: state.toggleTask,
      deleteTask: state.deleteTask,
      togglePinTask: state.togglePinTask,
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm transition-all duration-200",
              task.completed && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
        </div>
        {task.categoryId && (
          <CategoryBadge categoryId={task.categoryId} className="mt-1" />
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          className="text-muted-foreground hover:text-yellow-500"
          onClick={(e) => {
            e.stopPropagation();
            togglePinTask(task.id);
          }}
        >
          <Icons.star
            className={cn(
              "h-4 w-4",
              task.pinned ? "fill-yellow-400 text-yellow-400" : ""
            )}
          />
        </button>
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
