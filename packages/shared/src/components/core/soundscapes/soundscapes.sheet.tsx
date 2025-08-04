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
import { useShallow } from "zustand/shallow";
import { SoundList } from "./components/sound-list/sound-list";
import { CategoryList } from "./components/categories/category-list";
import { SoundControlsBar } from "./components/sound-player/controls/sound-control-bar";
import { ConnectionWarning } from "../../common/connection-warning";
import { SoundSyncStatus } from "./sound-sync-status";
import { useSoundSyncProgress } from "./use-sound-sync-progress";

export interface SoundscapesSheetProps {}

export interface SoundscapesBodyProps {
  readonly isSyncing: boolean;
}

const SoundscapesBody: React.FC<SoundscapesBodyProps> = ({ isSyncing }) => (
  <>
    <SoundSyncStatus />
    {isSyncing ? null : (
      <>
        <CategoryList />
        <ConnectionWarning />
        <div className="flex-1 overflow-y-auto">
          <SoundList />
        </div>
      </>
    )}
  </>
);

/**
 * Display soundscape controls and sounds.
 */
export const SoundscapesSheet: React.FC<SoundscapesSheetProps> = () => {
  const { t } = useTranslation();
  const { isSoundscapesVisible, setSoundscapesVisible } = useDockStore(
    useShallow((s) => ({
      isSoundscapesVisible: s.isSoundscapesVisible,
      setSoundscapesVisible: s.setSoundscapesVisible,
    })),
  );
  const progress = useSoundSyncProgress();
  const isSyncing = !progress.isComplete;
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
          <SoundscapesBody isSyncing={isSyncing} />
        </div>
        {isSyncing ? null : <SoundControlsBar />}
      </SheetContent>
    </Sheet>
  );
};
