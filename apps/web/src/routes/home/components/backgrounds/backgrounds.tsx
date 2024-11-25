import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useBackgroundStore } from "@/stores/background.store";

export const Background = () => {
  const { currentBackground } = useBackgroundStore();

  if (!currentBackground) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-transparent bg-cover bg-center bg-no-repeat",
        "m-0 p-0 transition-transform duration-300 ease-out"
      )}
    >
      <div
        className="absolute inset-0 bg-transparent bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${currentBackground.url}')`,
        }}
      />
    </div>
  );
};

export const BackgroundOverlay = () => {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/5",
        "transition-transform duration-300 ease-out"
      )}
    />
  );
};
