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

import { BREATHING_METHODS, useBreathingStore } from "../store/breathing.store";

export const BreatheMethodSelectorDialog: React.FC = () => {
  const { selectedMethod, setSelectedMethod: setSelectedMethod } =
    useBreathingStore();
  const { isOpen, open, close } = useDisclosure();

  if (!selectedMethod) return null;

  return (
    <>
      <div className="fixed bottom-32 flex flex-col items-center gap-2">
        <p className="text-white/50">
          <small> {selectedMethod.description}</small>
        </p>
        <Button variant="glass" onClick={() => open()}>
          Change Breathe Method
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
        <DialogContent className="p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">Breathing Method</DialogTitle>
            <DialogDescription>
              Select a breathing method to help you relax and focus
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {BREATHING_METHODS.map((method) => {
              return (
                <motion.button
                  key={method.name}
                  onClick={() => {
                    setSelectedMethod(method);
                    close();
                  }}
                  className={cn(
                    "relative flex flex-col justify-start gap-1 rounded-xl p-4 text-left transition-all hover:bg-opacity-20",
                    method.className,
                    selectedMethod.name === method.name &&
                      "ring-2 ring-white/20"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <h2 className={cn("text-md mb-2 font-semibold")}>
                    {method.name}
                  </h2>
                  <p className="text-sm text-black opacity-80 dark:text-white">
                    {method.description}
                  </p>
                  <p className="hidden text-sm text-black opacity-60 dark:text-white sm:block">
                    {method.details}
                  </p>
                  {selectedMethod.name === method.name && (
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
