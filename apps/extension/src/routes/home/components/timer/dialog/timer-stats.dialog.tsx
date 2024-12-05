import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { t } from "i18next";

import { Icons } from "@/components/icons/icons";

import { TimerExpandedContent } from "../components/timer-expanded-content";

interface TimerStatsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsClick: () => void;
}

export const TimerStatsDialog = ({
  isOpen,
  onOpenChange,
  onSettingsClick,
}: TimerStatsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="sm:max-w-sm"
        // onInteractOutside={(e) => {
        //   e.preventDefault();
        // }}
      >
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{t("timer.stats.title")}</DialogTitle>
            <DialogDescription>
              {t("timer.stats.description")}
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        <TimerExpandedContent />
        <DialogFooter className="sm:justify-between">
          <Button variant="secondary" onClick={onSettingsClick}>
            <Icons.settings className="size-4" />
            <span className="sr-only">{t("common.actions.edit")}</span>
          </Button>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.actions.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
