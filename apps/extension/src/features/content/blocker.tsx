import { type Quote } from "@/config/quote";
import { LockKeyhole } from "lucide-react";
import React from "react";

interface BlockerProps {
  siteName: string;
  message: Quote;
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
      <div className="meelio-my-auto meelio-flex meelio-w-full meelio-max-w-lg meelio-items-center meelio-justify-center meelio-px-4">
        <div className="max-h-[90vh] meelio-flex meelio-flex-col meelio-items-center meelio-gap-3 meelio-text-center sm:meelio-gap-6">
          {/* Emoji */}
          <div className="meelio-animate-bounce meelio-text-[30px] sm:meelio-text-[60px] md:meelio-text-[36px]">
            {message.icon}
          </div>

          {/* Title */}
          <h1 className="meelio-text-[20px] meelio-font-semibold meelio-leading-tight meelio-text-white sm:meelio-text-[30px] md:meelio-text-[24px]">
            {message.title}
          </h1>

          {/* Quote */}
          <div className="meelio-space-y-1 sm:meelio-space-y-2">
            <p className="meelio-text-[14px] meelio-text-white/90 sm:meelio-text-[16px]">
              "{message.quote}"
            </p>
            <p className="meelio-text-[12px] meelio-text-white/70 sm:meelio-text-[14px]">
              - {message.author}
            </p>
          </div>

          {/* Stats */}
          <div className="meelio-space-y-1 meelio-text-white/80">
            <p className="meelio-flex meelio-items-center meelio-justify-center meelio-gap-2 meelio-text-[12px] sm:meelio-text-[14px]">
              {siteName}
            </p>
            <p className="meelio-text-[12px] sm:meelio-text-[14px]">
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
                className="meelio-mt-2 meelio-rounded-full meelio-bg-white/90 meelio-px-6 meelio-py-2 meelio-text-[12px] meelio-font-medium meelio-text-gray-900 meelio-transition-colors hover:meelio-bg-white sm:meelio-mt-4 sm:meelio-max-w-64 sm:meelio-py-3 sm:meelio-text-[16px]"
              >
                {message.buttonText}
              </button>
            </div>

            <button
              onClick={onOpenAnyway}
              className="meelio-mt-2 meelio-flex meelio-w-full meelio-items-center meelio-justify-center meelio-gap-2 meelio-py-2 meelio-text-white/60 meelio-transition-colors hover:meelio-text-white/90"
            >
              <LockKeyhole className="meelio-h-4 meelio-w-4" />
              <span className="meelio-text-[14px]">
                Open "{siteName}" anyway
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
