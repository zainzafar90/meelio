import React from "react";

import { useTranslation } from "react-i18next";

import { CategoryList } from "@/routes/home/components/soundscapes/components/categories/category-list";
import { SoundList } from "@/routes/home/components/soundscapes/components/sound-list/sound-list";
import { SoundControlsBar } from "@/routes/home/components/soundscapes/components/sound-player/controls/sound-control-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useDockStore } from "@/stores/dock.store";

export const SoundscapesDialog: React.FC = () => {
  const { t } = useTranslation();

  const { isSoundscapesVisible, setSoundscapesVisible } = useDockStore(
    (state) => ({
      isSoundscapesVisible: state.isSoundscapesVisible,
      setSoundscapesVisible: state.setSoundscapesVisible,
    })
  );

  return (
    <Dialog open={isSoundscapesVisible} onOpenChange={setSoundscapesVisible}>
      <DialogContent className="h-[80vh] max-w-lg p-0">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{t("soundscapes.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("soundscapes.dialog.description")}
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        <div className="flex h-full flex-col overflow-hidden p-6">
          <CategoryList />
          <div className="flex-1 overflow-y-auto">
            <SoundList />
          </div>
        </div>
        <SoundControlsBar />
      </DialogContent>
    </Dialog>
  );
};
