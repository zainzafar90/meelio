import React from "react";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useTranslation } from "react-i18next";

import { CategoryList } from "@/components/soundscape/categories/category-list";
import { SoundControlsBar } from "@/components/soundscape/controls/sound-control-bar";
import { SoundList } from "@/components/soundscape/sound-list/sound-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        <VisuallyHidden.Root>
          <DialogHeader>
            <DialogTitle>{t("soundscapes.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("soundscapes.dialog.description")}
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden.Root>
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
