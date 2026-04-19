import { Brain } from "lucide-react";

interface ZenPrimaryActionProps {
  label: string;
  onClick: () => void;
}

export const ZenPrimaryAction = ({
  label,
  onClick,
}: ZenPrimaryActionProps) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-zinc-950 shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:-translate-y-0.5 sm:h-10 sm:px-5"
  >
    <Brain className="size-3.5" />
    <span>{label}</span>
  </button>
);
