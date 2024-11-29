import React from "react";
import { type Quote } from "@/config/quote";

interface BlockerProps {
  siteName: string;
  message: Quote | null;
}

export default function Blocker({ siteName, message }: BlockerProps) {
  return (
    <div
      className={`${message.bgColor} meelio-fixed meelio-inset-0 meelio-flex meelio-h-screen meelio-w-screen meelio-flex-1 meelio-cursor-pointer meelio-items-center meelio-justify-center meelio-overflow-hidden meelio-p-8 meelio-shadow-xl meelio-transition-colors meelio-duration-300`}
    >
      <div className="meelio-mx-auto meelio-flex meelio-h-full meelio-w-full meelio-max-w-md meelio-items-center meelio-justify-center">
        <div className="meelio-flex meelio-flex-col meelio-items-center meelio-gap-8 meelio-text-center">
          {/* Emoji */}
          <div className="meelio-mb-4 meelio-text-6xl">{message.icon}</div>

          {/* Title */}
          <h1 className="meelio-mb-4 meelio-text-balance meelio-text-3xl meelio-font-semibold meelio-leading-tight meelio-text-white">
            {message.title}
          </h1>

          {/* Quote */}
          <div className="meelio-space-y-2">
            <p className="meelio-text-white/90">"{message.quote}"</p>
            <p className="meelio-text-sm meelio-text-white/70">
              - {message.author}
            </p>
          </div>

          {/* Stats */}
          <div className="meelio-mt-6 meelio-space-y-2 meelio-text-white/80">
            <p className="meelio-flex meelio-items-center meelio-justify-center meelio-gap-2">
              {siteName}
            </p>
            <p>
              <span className="meelio-text-blue-300">🔥</span> Block Streak: 4
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="meelio-mt-4 meelio-w-full meelio-max-w-64 meelio-rounded-full meelio-bg-white/90 meelio-py-3 meelio-font-medium meelio-text-gray-900 meelio-transition-colors hover:meelio-bg-white"
          >
            {message.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
