import { KeyboardEvent, useState } from "react";

import { Input } from "@repo/ui/components/ui/input";
import { useTranslation } from "react-i18next";
import { Button } from "@repo/ui/components/ui/button";
import { useTodoStore } from "../../../../stores/todo.store";
import { useShallow } from "zustand/shallow";

import { Icons } from "../../../../components/icons";

export function CreateTask() {
  const [title, setTitle] = useState("");
  const { t } = useTranslation();
  const { activeCategory, addTask } = useTodoStore(
    useShallow((state) => ({
      activeCategory: state.activeCategory,
      addTask: state.addTask,
    }))
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && title.trim()) {
      addTask({
        title: title.trim(),
        category: activeCategory === "completed" || activeCategory === "all" || !activeCategory ? undefined : activeCategory,
      });
      setTitle("");
    }
  };

  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-border/10 bg-card/50">
      <Icons.add className="h-5 w-5 text-muted-foreground" />
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border-0 bg-transparent focus-visible:ring-0"
        placeholder={
          activeCategory === "completed"
            ? t("todo.list.task.add.completed")
            : t("todo.list.task.add.normal")
        }
        autoFocus
      />
    </div>
  );
}
