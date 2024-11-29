import React from "react"
import { type BlockedSite } from "@/config/sites"

interface BlockerProps {
  siteName: string
  message: BlockedSite | null
}

export default function Blocker({ siteName, message }: BlockerProps) {

  return (
    <div
      className={`meelio-fixed meelio-inset-0 meelio-w-screen meelio-h-screen meelio-overflow-hidden meelio-p-8 meelio-shadow-xl meelio-cursor-pointer meelio-transition-colors meelio-duration-300 meelio-flex meelio-items-center meelio-justify-center meelio-flex-1`}>
      <div className="meelio-flex meelio-items-center meelio-justify-center meelio-h-full meelio-w-full meelio-max-w-md meelio-mx-auto">
        <div className="meelio-flex meelio-flex-col meelio-items-center meelio-text-center meelio-gap-8">
          {/* Emoji */}
          <div className="meelio-text-6xl meelio-mb-4">{message.icon}</div>
          

          {/* Title */}
          <h1 className="meelio-text-3xl meelio-font-semibold meelio-text-white meelio-mb-4 meelio-leading-tight meelio-text-balance">
            {message.title}
          </h1>

          {/* Quote */}
          <div className="meelio-space-y-2">
            <p className="meelio-text-white/90">"{message.quote}"</p>
            <p className="meelio-text-white/70 meelio-text-sm">
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
            className="meelio-w-full meelio-bg-white/90 hover:meelio-bg-white meelio-text-gray-900 meelio-rounded-full meelio-py-3 meelio-font-medium meelio-transition-colors meelio-mt-4 meelio-max-w-64">
            {message.buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}
