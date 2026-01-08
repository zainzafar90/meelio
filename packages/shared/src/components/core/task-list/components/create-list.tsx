import { useState } from "react";

import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { useTaskStore } from "../../../../stores/task.store";
import { useCategoryStore } from "../../../../stores/category.store";
import { toast } from "sonner";

import { useShallow } from "zustand/shallow";

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
  const { t } = useTranslation();

  const { setActiveList, loadCategoriesAsLists } = useTaskStore(
    useShallow((state) => ({
      setActiveList: state.setActiveList,
      loadCategoriesAsLists: state.loadCategoriesAsLists,
    }))
  );

  const { createCategory } = useCategoryStore(
    useShallow((state) => ({
      createCategory: state.createCategory,
    }))
  );

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      const category = await createCategory({
        name: name.trim(),
        icon: selectedEmoji,
      });

      await loadCategoriesAsLists();
      setActiveList(category.id);

      setName("");
      setSelectedEmoji("📝");
      setOpen(false);
    } catch (error) {
      console.error("Failed to create category:", error);
      toast.error("Failed to create category");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your tasks
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 w-full md:flex-row flex-col">
            <Label htmlFor="emoji" className="sr-only">
              {t("tasks.list.create.emoji.label")}
            </Label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="emoji"
                  variant="outline"
                  className="w-[60px] text-lg"
                  aria-label={t("tasks.list.create.emoji.selected", {
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
                      aria-label={t("tasks.list.create.emoji.select", { emoji })}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex w-full items-center gap-2">
              <Label htmlFor="name" className="sr-only">
                {t("tasks.list.create.name.label")}
              </Label>
              <Input
                id="name"
                placeholder={t("tasks.list.create.name.placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button
              className="w-full md:w-auto"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
