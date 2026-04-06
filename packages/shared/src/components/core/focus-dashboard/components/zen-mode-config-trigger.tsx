import { Settings2 } from "lucide-react";

export const ZenModeConfigTrigger = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-8 items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3.5 text-xs font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-colors hover:bg-white/18 sm:h-10 sm:px-4"
  >
    <Settings2 className="size-3.5 text-white/82" />
    <span>{label}</span>
  </button>
);
