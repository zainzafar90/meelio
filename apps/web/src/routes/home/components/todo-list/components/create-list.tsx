import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTodoStore } from "@/stores/todo.store";

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
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>
            Create a new list to organize your tasks. Choose an emoji and give
            it a name.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="emoji" className="sr-only">
              List Icon
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="emoji"
                  variant="outline"
                  className="w-[60px] text-lg"
                  aria-label={`Selected emoji: ${selectedEmoji}`}
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
                      aria-label={`Select emoji ${emoji}`}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Label htmlFor="name" className="sr-only">
              List Name
            </Label>
            <Input
              id="name"
              placeholder="Enter list name"
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
            <Plus className="h-4 w-4" /> Create List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
