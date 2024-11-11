import { allCategories } from "@/config/category-data";

import { CategoryItem } from "./category-item";

export const CategoryList = () => {
  return (
    <div className="relative mb-8 flex max-w-md flex-wrap gap-4 scroll-smooth">
      <div className="no-scrollbar flex gap-x-4 gap-y-6 overflow-x-scroll pr-24">
        {allCategories.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </div>
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-r from-background/10 to-background" />
    </div>
  );
};
