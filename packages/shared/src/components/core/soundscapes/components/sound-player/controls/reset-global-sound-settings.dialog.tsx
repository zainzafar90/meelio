import { useState } from "react";

import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

import { cn } from "../../../../../../lib";
import { Icons } from "../../../../../../components/icons";
import { useSoundscapesStore } from "../../../../../../stores/soundscapes.store";

export const ResetGlobalSoundSettingsDialog = () => {
  const { reset } = useSoundscapesStore();
  const [showResetSettingsDialog, setShowResetSettingsDialog] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus:ring-muted-background group relative flex h-8 w-8 items-center justify-center rounded-md bg-background/90 p-1 text-foreground/70 focus:outline-none focus:ring-1 focus:ring-offset-1"
          )}
          onClick={() => setShowResetSettingsDialog(true)}
        >
          <div className="absolute -inset-4 md:hidden" />
          <Icons.reset className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Clear all sounds & settings</p>
      </TooltipContent>

      <Dialog
        open={showResetSettingsDialog}
        onOpenChange={setShowResetSettingsDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Sounds & Settings</DialogTitle>
            <DialogDescription>
              Do you want to reset all sounds and settings? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowResetSettingsDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                reset();
                setShowResetSettingsDialog(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tooltip>
  );
};
