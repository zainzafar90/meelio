import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useBackgroundStore } from "@/stores/background.store";
import { useDockStore } from "@/stores/dock.store";

export const BackgroundSelectorSheet = () => {
  const { t } = useTranslation();
  const { backgrounds, currentBackground, setCurrentBackground } =
    useBackgroundStore();
  const { isBackgroundsVisible, toggleBackgrounds } = useDockStore();

  return (
    <Sheet open={isBackgroundsVisible} onOpenChange={toggleBackgrounds}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("backgrounds.title")}</SheetTitle>
        </SheetHeader>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {backgrounds.map((background) => (
            <button
              key={background.id}
              onClick={() => setCurrentBackground(background)}
              className={cn(
                "group relative aspect-video overflow-hidden rounded-lg",
                "border-2 transition-all hover:border-white/50",
                currentBackground?.id === background.id
                  ? "border-white/50"
                  : "border-transparent"
              )}
            >
              <picture>
                {/* Thumbnail for preview */}
                <source
                  srcSet={`${background.thumbnail}&dpr=2`}
                  media="(-webkit-min-device-pixel-ratio: 2)"
                />
                <img
                  src={background.thumbnail}
                  alt={background.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <div className="absolute inset-0 bg-black/40 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-sm font-medium text-white">
                  {background.title}
                </p>
                <p className="text-xs text-white/70">by {background.author}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // TODO: Implement background addition
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("backgrounds.addNew")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
