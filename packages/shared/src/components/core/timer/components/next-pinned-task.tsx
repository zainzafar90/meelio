import { useTodoStore } from "../../../stores/todo.store";
import { useShallow } from "zustand/shallow";
import { Icons } from "../../icons";

export const NextPinnedTask = () => {
  const next = useTodoStore(
    useShallow((state) => state.getNextPinnedTask())
  );

  if (!next) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-yellow-500">
      <Icons.star className="h-4 w-4 fill-yellow-400" />
      <span className="truncate max-w-[200px]">{next.title}</span>
    </div>
  );
};
