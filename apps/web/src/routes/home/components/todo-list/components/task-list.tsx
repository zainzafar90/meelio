import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { Badge } from "@/components/ui/badge";
import { Task, useTodoStore } from "@/stores/todo.store";

interface TaskListProps {
  title: string;
  tasks: Task[];
  count: number;
  icon?: string;
}

export function TaskList({ title, tasks, count, icon }: TaskListProps) {
  if (tasks.length === 0)
    return (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">No tasks</p>
      </div>
    );

  return (
    <div className="mt-4">
      <div className="ml-0 space-y-2 border-l border-border/10">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

const TaskItem = ({ task }: { task: Task }) => {
  const { toggleTask, deleteTask, lists, activeListId } = useTodoStore();
  const taskList = lists.find((list) => list.id === task.listId);

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
        {activeListId === "all" && taskList && (
          <span className="text-xs text-muted-foreground">
            {taskList.emoji} {taskList.name}
          </span>
        )}
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
