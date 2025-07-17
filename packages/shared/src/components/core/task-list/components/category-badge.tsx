import { useEffect } from "react";
import { Badge } from "@repo/ui/components/ui/badge";
import { useAuthStore } from "../../../../stores/auth.store";
import { useCategoryStore } from "../../../../stores/category.store";
import { useShallow } from "zustand/shallow";
import { cn } from "../../../../lib";

interface CategoryBadgeProps {
  categoryId?: string;
  className?: string;
}

export function CategoryBadge({ categoryId, className }: CategoryBadgeProps) {
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );
  
  const { getCategoryById, loadCategories } = useCategoryStore(
    useShallow((state) => ({
      getCategoryById: state.getCategoryById,
      loadCategories: state.loadCategories,
    }))
  );

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user, loadCategories]);
  
  const category = categoryId ? getCategoryById(categoryId) : null;

  if (!categoryId || !category) return null;

  return (
    <Badge variant="secondary" className={cn("text-xs", className)}>
      {category.name}
    </Badge>
  );
}