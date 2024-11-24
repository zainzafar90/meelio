import { Task } from "@/lib/db/todo-db";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { Badge } from "@/components/ui/badge";
import { useTodoStore } from "@/stores/todo.store";

interface TaskListProps {
  title: string;
  tasks: Task[];
  count: number;
  icon?: string;
  activeListId: string;
}

export function TaskList({
  title,
  tasks,
  count,
  icon,
  activeListId,
}: TaskListProps) {
  const { lists } = useTodoStore();

  if (tasks.length === 0)
    return (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">No tasks</p>
      </div>
    );

  if (activeListId === "all") {
    const tasksByList = tasks.reduce(
      (acc, task) => {
        if (!acc[task.listId]) {
          acc[task.listId] = [];
        }
        acc[task.listId].push(task);
        return acc;
      },
      {} as Record<string, Task[]>
    );

    return (
      <div className="mt-4 space-y-8">
        {Object.entries(tasksByList).map(([listId, listTasks]) => {
          const list = lists.find((l) => l.id === listId);
          if (!list) return null;

          return (
            <div key={listId} className="space-y-2">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{list.emoji}</span>
                  <span>{list.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {listTasks.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {listTasks.map((task) => (
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
  const { toggleTask, deleteTask } = useTodoStore();

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
        <Badge
          className="uppercase"
          variant={
            task.date === "Today"
              ? "secondary"
              : task.date === "Tomorrow"
                ? "outline"
                : "secondary"
          }
        >
          {task.date}
        </Badge>
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
