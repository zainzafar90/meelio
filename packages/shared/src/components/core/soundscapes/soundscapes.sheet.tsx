import React from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { useTranslation } from "react-i18next";
import { useDockStore } from "../../../stores/dock.store";
import { useSoundscapesStore } from "../../../stores/soundscapes.store";
import { useShallow } from "zustand/shallow";
import { SoundList } from "./components/sound-list/sound-list";
import { CategoryList } from "./components/categories/category-list";
import { SoundControlsBar } from "./components/sound-player/controls/sound-control-bar";

export const SoundscapesSheet: React.FC = () => {
  const { t } = useTranslation();

  const { isSoundscapesVisible, setSoundscapesVisible } = useDockStore(
    useShallow((state) => ({
      isSoundscapesVisible: state.isSoundscapesVisible,
      setSoundscapesVisible: state.setSoundscapesVisible,
    }))
  );

  return (
    <Sheet open={isSoundscapesVisible} onOpenChange={setSoundscapesVisible}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <div className="absolute inset-0 bg-white dark:bg-black dark:opacity-10" />
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>{t("soundscapes.dialog.title")}</SheetTitle>
            <SheetDescription>
              {t("soundscapes.dialog.description")}
            </SheetDescription>
          </SheetHeader>
        </VisuallyHidden>
        <div className="flex h-full flex-col overflow-hidden p-6">
          <CategoryList />
          <div className="flex-1 overflow-y-auto">
            <SoundList />
          </div>
        </div>
        <SoundControlsBar />
      </SheetContent>
    </Sheet>
  );
};
