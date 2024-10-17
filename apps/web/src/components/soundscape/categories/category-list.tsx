import { allCategories } from "@/config/category-data";

import { CategoryItem } from "./category-item";

export const CategoryList = () => {
  return (
    <div className="relative flex flex-wrap gap-4 mb-8 scroll-smooth">
      <div className="overflow-x-scroll no-scrollbar flex px-2 py-4 gap-y-6 gap-x-4 pr-24">
        {allCategories.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </div>
      <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-r from-background/10 to-background" />
    </div>
  );
};
