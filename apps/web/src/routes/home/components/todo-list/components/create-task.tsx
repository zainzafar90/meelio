import { KeyboardEvent, useState } from "react";

import { Circle, Plus } from "lucide-react";

import { Icons } from "@/components/icons/icons";
import { Input } from "@/components/ui/input";
import { useTodoStore } from "@/stores/todo.store";

export function CreateTask() {
  const [title, setTitle] = useState("");
  const { activeListId, addTask } = useTodoStore();

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && title.trim()) {
      addTask({
        id: crypto.randomUUID(),
        title: title.trim(),
        completed: false,
        date: "Today",
        listId: activeListId,
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
        placeholder="Add a Task"
        autoFocus
      />
    </div>
  );
}
