import { Switch } from "@headlessui/react";

import { Category, CategoryType } from "@/types/category";
import { Telemetry } from "@/lib/telemetry/telemetry";
import { cn } from "@/lib/utils";
import { CategoryIcons } from "@/components/icons/category-icons";
import { Icons } from "@/components/icons/icons";
import { useSoundscapesStore } from "@/stores/soundscapes.store";

interface CategoryItemProps {
  category: CategoryType;
}
export const CategoryItem: React.FC<CategoryItemProps> = ({ category }) => {
  const { playCategory, playRandom, activeCategoryId } = useSoundscapesStore();

  const isActiveCategory = (category: Category) => {
    return activeCategoryId === category;
  };

  const playCategorySound = (category: Category) => {
    if (category === Category.Random) {
      playRandom();
      return;
    }
    playCategory(category);
  };

  return (
    <Switch
      key={category.id}
      as="div"
      checked={activeCategoryId === category.name}
      onChange={() => {
        playCategorySound(category.name as Category);

        if (typeof window === "undefined") return;
        if (isActiveCategory(category.name as Category)) {
          Telemetry.instance.categoryStopped(category.name as Category);
        } else {
          Telemetry.instance.categoryPlayed(category.name as Category);
        }
      }}
      className={cn(
        isActiveCategory(category.name as Category)
          ? "border-accent ring-1 ring-accent"
          : "border-foreground/20 transition hover:border-foreground/50",
        "relative m-1 flex min-w-48 flex-shrink-0 cursor-pointer select-none rounded-lg border bg-background/50 p-4 shadow-sm focus:outline-none"
      )}
    >
      <div className="flex flex-1 gap-4">
        <div className="flex">
          <div className="flex-shrink-0 text-lg">
            {getCategoryIcon(category.name)}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="block text-sm font-medium text-foreground/90">
            {category.title}
          </span>
          {/* <span className="mt-1 flex max-w-[12rem] items-center text-sm text-foreground/50">
            {category.description}
          </span> */}
        </div>
      </div>
      <div className="pl-5">
        <Icons.checkFilled
          className={cn(
            !isActiveCategory(category.name as Category) ? "invisible" : "",
            "h-5 w-5 text-accent"
          )}
          aria-hidden="true"
        />
      </div>
    </Switch>
  );
};

const getCategoryIcon = (category: Category) => {
  const className = "w-6 h-6 flex-none";
  switch (category) {
    case Category.Productivity:
      return <CategoryIcons.productivity className={className} />;
    case Category.Random:
      return <CategoryIcons.random className={className} />;
    case Category.Relax:
      return <CategoryIcons.relax className={className} />;
    case Category.NoiseBlocker:
      return <CategoryIcons.noiseBlocker className={className} />;
    case Category.CreativeThinking:
      return <CategoryIcons.creativeThinking className={className} />;
    case Category.BeautifulAmbients:
      return <CategoryIcons.beautifulAmbients className={className} />;
    case Category.Motivation:
      return <CategoryIcons.motivation className={className} />;
    case Category.Sleep:
      return <CategoryIcons.sleep className={className} />;
    case Category.Studying:
      return <CategoryIcons.studying className={className} />;
    case Category.Writing:
      return <CategoryIcons.writing className={className} />;

    default:
      return null;
  }
};
