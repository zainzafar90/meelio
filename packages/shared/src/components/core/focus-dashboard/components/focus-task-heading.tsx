import { CircleDashed } from "lucide-react";

import { cn } from "../../../../lib";

interface FocusTaskHeadingProps {
  eyebrow?: string;
  label: string;
  isSelectable: boolean;
  isEmptyState?: boolean;
  onSelectTask: () => void;
  containerClassName?: string;
  headingClassName: string;
}

export const FocusTaskHeading = ({
  eyebrow,
  label,
  isSelectable,
  isEmptyState = false,
  onSelectTask,
  containerClassName,
  headingClassName,
}: FocusTaskHeadingProps) => {
  if (isSelectable) {
    return (
      <button
        type="button"
        onClick={onSelectTask}
        className={cn(
          "flex flex-col items-center space-y-3 text-center transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20",
          containerClassName,
        )}
      >
        {eyebrow ? (
          <p className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/62">
            {isEmptyState ? <CircleDashed className="size-3.5 text-white/52" /> : null}
            {eyebrow}
          </p>
        ) : null}
        <span className={cn("block", headingClassName)}>{label}</span>
      </button>
    );
  }

  return (
    <div className={cn("cursor-default space-y-3 text-center", containerClassName)}>
      {eyebrow ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/62">
          {eyebrow}
        </p>
      ) : null}
      <h2 className={headingClassName}>{label}</h2>
    </div>
  );
};
