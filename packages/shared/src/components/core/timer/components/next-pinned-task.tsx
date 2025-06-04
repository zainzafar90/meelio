import { useTodoStore } from "../../../../stores/todo.store";
import { useShallow } from "zustand/shallow";
import { Icons } from "../../../../components/icons/icons";
import { AnimatePresence, motion } from "framer-motion";

export const NextPinnedTask = () => {
  const next = useTodoStore(useShallow((state) => state.getNextPinnedTask()));

  if (!next) return <div className="h-5 w-full" />;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center gap-2 text-sm"
      >
        <Icons.star className="h-4 w-4 text-yellow-400" />
        <span className="truncate max-w-[200px]">{next.title}</span>
      </motion.div>
    </AnimatePresence>
  );
};
