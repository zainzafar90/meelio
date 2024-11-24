import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

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
            <DialogTitle>Pomodoro</DialogTitle>
            <DialogDescription>
              Pomodoro is a time management technique that uses a timer to break
              work into intervals, typically 25 minutes in length, separated by
              short breaks.
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        <TimerExpandedContent />
        <DialogFooter className="sm:justify-between">
          <Button variant="secondary" onClick={onSettingsClick}>
            <Icons.settings className="size-4" />
          </Button>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
