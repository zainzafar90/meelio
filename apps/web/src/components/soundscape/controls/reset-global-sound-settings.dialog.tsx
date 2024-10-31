import { useState } from "react";

import { cn } from "@/lib/utils";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSoundscapesStore } from "@/stores/soundscapes.store";

export const ResetGlobalSoundSettingsDialog = () => {
  const { reset } = useSoundscapesStore();
  const [showResetSettingsDialog, setShowResetSettingsDialog] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex items-center justify-center w-8 h-8 p-1 relative rounded-md bg-background/90 text-foreground/70 focus:outline-none focus:ring-1 focus:ring-muted-background focus:ring-offset-1"
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
