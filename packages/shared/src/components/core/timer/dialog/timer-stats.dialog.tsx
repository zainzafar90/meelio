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

import { TimerExpandedContent } from "../components/timer-expanded-content";
import { PremiumFeature } from "../../../common/premium-feature";

interface TimerStatsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TimerStatsDialog = ({
  isOpen,
  onOpenChange,
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
        <PremiumFeature
          requirePro={true}
          features={[
            "Weekly focus statistics",
            "Track focus vs break time patterns",
            "And unlock more Pro features...",
          ]}
        >
          <TimerExpandedContent />
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.actions.close")}
            </Button>
          </DialogFooter>
        </PremiumFeature>
      </DialogContent>
    </Dialog>
  );
};
