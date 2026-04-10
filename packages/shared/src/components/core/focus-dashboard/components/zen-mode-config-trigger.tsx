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
    className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-3.5 text-sm font-medium text-white/88 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-all duration-200 hover:bg-white/18 hover:text-white sm:h-10 sm:px-4"
  >
    <Settings2 className="size-3.5 text-white/82" />
    <span>{label}</span>
  </button>
);
