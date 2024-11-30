import { type Quote } from "@/config/quote";
import { LockKeyhole } from "lucide-react";
import React from "react";

interface BlockerProps {
  siteName: string;
  message: Quote | null;
  onOpenAnyway: () => void;
}

export function Blocker({ siteName, message, onOpenAnyway }: BlockerProps) {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.close();
  };

  return (
    <div
      className={`${message.bgColor} meelio-fixed meelio-inset-0 meelio-flex meelio-h-screen meelio-w-screen meelio-flex-1 meelio-cursor-pointer meelio-items-center meelio-justify-center meelio-overflow-auto meelio-p-4 meelio-shadow-xl meelio-transition-colors meelio-duration-300 sm:meelio-p-8`}
    >
      <div className="meelio-my-auto meelio-flex meelio-w-full meelio-max-w-md meelio-items-center meelio-justify-center meelio-px-4">
        <div className="max-h-[90vh] meelio-flex meelio-flex-col meelio-items-center meelio-gap-3 meelio-text-center sm:meelio-gap-6">
          {/* Emoji */}
          <div className="meelio-animate-bounce meelio-text-3xl sm:meelio-text-6xl md:meelio-text-4xl">
            {message.icon}
          </div>

          {/* Title */}
          <h1 className="meelio-text-balance meelio-text-xl meelio-font-semibold meelio-leading-tight meelio-text-white sm:meelio-text-3xl md:meelio-text-2xl">
            {message.title}
          </h1>

          {/* Quote */}
          <div className="meelio-space-y-1 sm:meelio-space-y-2">
            <p className="meelio-text-sm meelio-text-white/90 sm:meelio-text-base">
              "{message.quote}"
            </p>
            <p className="meelio-text-xs meelio-text-white/70 sm:meelio-text-sm">
              - {message.author}
            </p>
          </div>

          {/* Stats */}
          <div className="meelio-space-y-1 meelio-text-white/80">
            <p className="meelio-flex meelio-items-center meelio-justify-center meelio-gap-2 meelio-text-xs sm:meelio-text-base">
              {siteName}
            </p>
            <p className="meelio-text-xs sm:meelio-text-base">
              <span className="meelio-animate-pulse meelio-text-blue-300">
                🔥
              </span>{" "}
              Block Streak: 4
            </p>
          </div>

          <div className="meelio-flex meelio-flex-col meelio-space-y-4">
            {/* Action Button */}
            <div>
              <button
                onClick={handleClose}
                className="meelio-mt-2 meelio-rounded-full meelio-bg-white/90 meelio-px-6 meelio-py-2 meelio-text-xs meelio-font-medium meelio-text-gray-900 meelio-transition-colors hover:meelio-bg-white sm:meelio-mt-4 sm:meelio-max-w-64 sm:meelio-py-3 sm:meelio-text-base"
              >
                {message.buttonText}
              </button>
            </div>

            <button
              onClick={onOpenAnyway}
              className="meelio-mt-2 meelio-flex meelio-w-full meelio-items-center meelio-justify-center meelio-gap-2 meelio-py-2 meelio-text-white/60 meelio-transition-colors hover:meelio-text-white/90"
            >
              <LockKeyhole className="meelio-h-4 meelio-w-4" />
              <span className="meelio-text-sm">Open "{siteName}" anyway</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
