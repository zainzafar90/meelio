import React from "react";

import { useTranslation } from "react-i18next";

import { CategoryList } from "@/routes/home/components/soundscapes/components/categories/category-list";
import { SoundList } from "@/routes/home/components/soundscapes/components/sound-list/sound-list";
import { SoundControlsBar } from "@/routes/home/components/soundscapes/components/sound-player/controls/sound-control-bar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useDockStore } from "@/stores/dock.store";

export const SoundscapesSheet: React.FC = () => {
  const { t } = useTranslation();

  const { isSoundscapesVisible, setSoundscapesVisible } = useDockStore(
    (state) => ({
      isSoundscapesVisible: state.isSoundscapesVisible,
      setSoundscapesVisible: state.setSoundscapesVisible,
    })
  );

  return (
    <Sheet open={isSoundscapesVisible} onOpenChange={setSoundscapesVisible}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <div
          className="absolute inset-0 bg-black opacity-10"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1577730286200-046d1c45439a?q=80&w=2827&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
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
