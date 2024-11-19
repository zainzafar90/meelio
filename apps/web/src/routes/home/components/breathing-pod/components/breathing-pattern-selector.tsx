import React from "react";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDisclosure } from "@/hooks/use-disclosure";

import {
  BREATHING_PATTERNS,
  useBreathingStore,
} from "../store/breathing.store";

export const BreathingPatternSelector: React.FC = () => {
  const { selectedPattern, setSelectedPattern } = useBreathingStore();
  const { isOpen, open, close } = useDisclosure();

  if (!selectedPattern) return null;

  return (
    <>
      <div className="fixed bottom-32 flex flex-col items-center gap-2">
        <p className="text-white/50">
          <small> {selectedPattern.description}</small>
        </p>
        <Button variant="glass" onClick={() => open()}>
          Change Breathe Pattern
        </Button>
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) {
            close();
          } else {
            open();
          }
        }}
      >
        <DialogContent className="bg-gray-900 p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">Breathing Pattern</DialogTitle>
            <DialogDescription>
              Select a breathing pattern to help you relax and focus
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {BREATHING_PATTERNS.map((pattern) => {
              return (
                <motion.button
                  key={pattern.name}
                  onClick={() => {
                    setSelectedPattern(pattern);
                    close();
                  }}
                  className={cn(
                    "relative flex flex-col justify-start gap-1 rounded-xl p-6 text-left transition-all hover:bg-opacity-20",
                    pattern.className,
                    selectedPattern.name === pattern.name &&
                      "ring-2 ring-white/20"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <h2 className={cn("mb-2 text-xl font-semibold")}>
                    {pattern.name}
                  </h2>
                  <p className="text-md mb-1 text-white/80">
                    {pattern.description}
                  </p>
                  <p className="hidden text-sm text-white/60 sm:block">
                    {pattern.details}
                  </p>
                  {selectedPattern.name === pattern.name && (
                    <div className="absolute right-4 top-4">
                      <Icons.checkFilled className={cn("h-5 w-5")} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
