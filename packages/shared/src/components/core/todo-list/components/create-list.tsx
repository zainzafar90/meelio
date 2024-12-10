import { useState } from "react";

import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTodoStore } from "../../../../stores/todo.store";

const emojis = [
  "📝",
  "📚",
  "🎯",
  "💡",
  "🎨",
  "🏃‍♂️",
  "🎮",
  "🎵",
  "🍳",
  "🌱",
  "💪",
  "🎬",
  "✈️",
  "🏠",
  "📱",
  "💻",
  "🎓",
  "🛒",
  "🎁",
  "⭐️",
];

interface CreateListProps {
  children: React.ReactNode;
}

export function CreateList({ children }: CreateListProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📝");
  const { addList, setActiveList } = useTodoStore();
  const { t } = useTranslation();

  const handleCreate = () => {
    if (!name.trim()) return;

    const newListId = crypto.randomUUID();

    addList({
      id: newListId,
      name: name.trim(),
      type: "custom",
      emoji: selectedEmoji,
    });

    setActiveList(newListId);

    setName("");
    setSelectedEmoji("📝");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("todo.list.create.title")}</DialogTitle>
          <DialogDescription>
            {t("todo.list.create.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="emoji" className="sr-only">
              {t("todo.list.create.emoji.label")}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="emoji"
                  variant="outline"
                  className="w-[60px] text-lg"
                  aria-label={t("todo.list.create.emoji.selected", {
                    emoji: selectedEmoji,
                  })}
                >
                  {selectedEmoji}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2">
                <div className="grid grid-cols-5 gap-2">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      className="h-10 w-10 p-0 text-lg"
                      onClick={() => setSelectedEmoji(emoji)}
                      aria-label={t("todo.list.create.emoji.select", { emoji })}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Label htmlFor="name" className="sr-only">
              {t("todo.list.create.name.label")}
            </Label>
            <Input
              id="name"
              placeholder={t("todo.list.create.name.placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            className="w-full"
            disabled={!name.trim()}
          >
            <Plus className="h-4 w-4" /> {t("todo.list.create.button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
