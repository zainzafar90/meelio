import { Badge } from "@repo/ui/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useTaskStore } from "../../../../stores/task.store";
import { useShallow } from "zustand/shallow";
import { useState, useRef, useEffect } from "react";

import { Task } from "../../../../lib/db/models.dexie";
import { cn } from "../../../../lib";
import { Icons } from "../../../../components/icons";
import { getTaskFocusActionCopy } from "./task-list.helpers";

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
  const { t } = useTranslation();
  const { toggleTask, deleteTask, togglePinTask, editTask } = useTaskStore(
    useShallow((state) => ({
      toggleTask: state.toggleTask,
      deleteTask: state.deleteTask,
      togglePinTask: state.togglePinTask,
      editTask: state.editTask,
    }))
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusActionCopy = getTaskFocusActionCopy(task);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(task.title);
    setIsEditing(true);
  };

  const commitEdit = () => {
    if (editValue.trim() && editValue.trim() !== task.title) {
      editTask(task.id, editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setIsEditing(false);
  };

  return (
    <div
      key={task.id}
      onClick={() => !isEditing && toggleTask(task.id)}
      className="group flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted/50"
    >
      <button
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-foreground/50 transition-colors",
          task.completed ? "border-transparent bg-accent" : ""
        )}
        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
      >
        {task.completed ? (
          <Icons.check className="h-3 w-3 text-accent-foreground" />
        ) : (
          <span />
        )}
      </button>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-sm outline-none"
          />
        ) : (
          <span
            onDoubleClick={startEdit}
            className={cn(
              "text-sm transition-all duration-200",
              task.completed && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {task.dueDate && (
          <Badge className="uppercase" variant="secondary">
            {new Date(task.dueDate).toLocaleDateString()}
          </Badge>
        )}
        {focusActionCopy ? (
          <button
            type="button"
            title={focusActionCopy.title}
            aria-label={focusActionCopy.title}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              task.pinned
                ? "border-yellow-500/50 bg-yellow-500/12 text-yellow-300 hover:bg-yellow-500/18"
                : "border-border/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
              togglePinTask(task.id);
            }}
          >
            <Icons.pin
              className={cn("h-3.5 w-3.5", task.pinned ? "fill-current" : "")}
            />
            <span>
              {task.pinned
                ? t("tasks.item.focused", { defaultValue: focusActionCopy.label })
                : t("tasks.item.focus", { defaultValue: focusActionCopy.label })}
            </span>
          </button>
        ) : null}
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
