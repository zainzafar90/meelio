import { useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { useTranslation } from "react-i18next";
import { useCategoryStore } from "../../../../stores/category.store";
import { useAuthStore } from "../../../../stores/auth.store";
import { useShallow } from "zustand/shallow";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

interface CategoryManagerProps {
  children: ReactNode;
}

export function CategoryManager({ children }: CategoryManagerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  const { categories, createCategory, updateCategory, deleteCategory } = useCategoryStore(
    useShallow((state) => ({
      categories: state.categories,
      createCategory: state.createCategory,
      updateCategory: state.updateCategory,
      deleteCategory: state.deleteCategory,
    }))
  );

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await createCategory({ name: newCategoryName, icon: "" });
      setNewCategoryName("");
      toast.success("Category created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create category");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      await updateCategory(id, { name: editingName, icon: "" });
      setEditingId(null);
      setEditingName("");
      toast.success("Category updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update category");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Tasks in this category won't be deleted.`)) return;

    try {
      await deleteCategory(id);
      toast.success("Category deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("tasks.category.manage")}</DialogTitle>
          <DialogDescription>
            Create and manage categories for your tasks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <Button onClick={handleCreate} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories yet. Create one above!
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                  {editingId === category.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate(category.id);
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditingName("");
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleUpdate(category.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">{category.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(category.id);
                          setEditingName(category.name);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(category.id, category.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}