import React from "react";

import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { cn } from "../../../../lib/utils";
import { Icons } from "../../../../components/icons/icons";
import { useDisclosure } from "../../../../hooks/use-disclosure";

import {
  BREATHING_METHODS,
  SESSION_SET_OPTIONS,
  useBreathingStore,
} from "../store/breathing.store";

export const BreatheMethodSelectorDialog: React.FC = () => {
  const {
    selectedMethod,
    setSelectedMethod: setSelectedMethod,
    sessionSets,
    setSessionSets,
  } = useBreathingStore();
  const { isOpen, open, close } = useDisclosure();
  const { t } = useTranslation();

  if (!selectedMethod) return null;

  return (
    <>
      <div className="fixed bottom-32 flex flex-col items-center gap-2">
        <p className="text-white/50">
          <small> {selectedMethod.description}</small>
        </p>
        <Button variant="glass" onClick={() => open()}>
          {t("breathing.method.change")}
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
            <DialogTitle className="text-2xl">
              {t("breathing.method.title")}
            </DialogTitle>
            <DialogDescription>
              {t("breathing.method.description")}
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

          {/* Session Count Selector */}
          <div className="border-t p-6">
            <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
              Repetitions{" "}
              <span className="text-sm text-muted-foreground">
                (Inhale + Exhale + Hold = 1 Rep)
              </span>
            </h3>
            <div className="flex gap-3">
              {SESSION_SET_OPTIONS.map((sets) => (
                <motion.button
                  key={sets}
                  onClick={() => setSessionSets(sets)}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                    sessionSets === sets
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  {sets} reps
                </motion.button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
