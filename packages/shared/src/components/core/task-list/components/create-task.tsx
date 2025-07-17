import { KeyboardEvent, useState } from "react";

import { Input } from "@repo/ui/components/ui/input";
import { useTranslation } from "react-i18next";
import { useTaskStore } from "../../../../stores/task.store";
import { useShallow } from "zustand/shallow";

import { Icons } from "../../../../components/icons";

export function CreateTask() {
  const [title, setTitle] = useState("");
  const { t } = useTranslation();
  const { activeListId, addTask } = useTaskStore(
    useShallow((state) => ({
      activeListId: state.activeListId,
      addTask: state.addTask,
    }))
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && title.trim() && activeListId !== "completed") {
      const isSystemList = ["all", "completed", "today"].includes(
        activeListId || ""
      );

      let dueDate: string | undefined;
      if (activeListId === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate = today.toISOString();
      }

      addTask({
        title: title.trim(),
        dueDate,
      });
      setTitle("");
    }
  };

  const isCompletedTab = activeListId === "completed";

  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-border/10 bg-card/50">
      <Icons.add className={`h-5 w-5 ${isCompletedTab ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border-0 bg-transparent focus-visible:ring-0"
        placeholder={
          isCompletedTab
            ? "Cannot create tasks in completed view"
            : t("tasks.list.task.add.normal")
        }
        disabled={isCompletedTab}
        autoFocus={!isCompletedTab}
      />
    </div>
  );
}
