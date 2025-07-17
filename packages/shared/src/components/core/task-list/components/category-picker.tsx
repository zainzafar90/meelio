import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../../stores/auth.store";
import { useCategoryStore } from "../../../../stores/category.store";
import { useShallow } from "zustand/shallow";

interface CategoryPickerProps {
  value?: string;
  onChange: (categoryId: string | undefined) => void;
  inline?: boolean;
}

export function CategoryPicker({ value, onChange, inline = false }: CategoryPickerProps) {
  const { t } = useTranslation();
  
  const { user, guestUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
    }))
  );
  
  const { categories, loadCategories } = useCategoryStore(
    useShallow((state) => ({
      categories: state.categories,
      loadCategories: state.loadCategories,
    }))
  );

  useEffect(() => {
    if (user || guestUser) {
      loadCategories();
    }
  }, [user, guestUser, loadCategories]);

  const selectedCategory = categories.find((cat) => cat.id === value);

  if (inline) {
    return (
      <Select value={value || "none"} onValueChange={(val) => onChange(val === "none" ? undefined : val)}>
        <SelectTrigger className="h-7 border-0 bg-transparent px-2 text-xs">
          <SelectValue>
            {selectedCategory ? (
              <span className="text-muted-foreground">{selectedCategory.name}</span>
            ) : (
              <span className="text-muted-foreground/60">{t("tasks.category.select")}</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("tasks.category.none")}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value || "none"} onValueChange={(val) => onChange(val === "none" ? undefined : val)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("tasks.category.select")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t("tasks.category.none")}</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}