import React from "react"
import { type BlockedSite } from "@/config/sites"

interface BlockerProps {
  siteName: string
  message: BlockedSite | null
}

export default function Blocker({ siteName, message }: BlockerProps) {
  const getThemeClasses = (theme: string) => {
    const themes = {
      red: "meelio-bg-red-950",
      green: "meelio-bg-green-950",
      purple: "meelio-bg-purple-950",
      teal: "meelio-bg-teal-950",
      amber: "meelio-bg-amber-950"
    } as const
    return themes[theme as keyof typeof themes] || themes.purple
  }

  // const currentMessage = blockerMessages[messageIndex]
  const themeClass = getThemeClasses(message?.theme || "purple")

  const cycleMessage = () => {
    // setMessageIndex((prev) => (prev + 1) % blockerMessages.length)
  }

  return (
    <div
      onClick={cycleMessage}
      className={`meelio-fixed meelio-inset-0 meelio-z-[999999999] meelio-w-screen meelio-h-screen ${themeClass} meelio-overflow-hidden meelio-p-8 meelio-shadow-xl meelio-cursor-pointer meelio-transition-colors meelio-duration-300 meelio-flex meelio-items-center meelio-justify-center meelio-flex-1`}>
      <div className="meelio-flex meelio-items-center meelio-justify-center meelio-h-full meelio-w-full meelio-max-w-md meelio-mx-auto">
        <div className="meelio-flex meelio-flex-col meelio-items-center meelio-text-center meelio-gap-8">
          {/* Emoji */}
          <div className="meelio-text-6xl meelio-mb-4">{message.mainEmoji}</div>

          {/* Title */}
          <h1 className="meelio-text-3xl meelio-font-semibold meelio-text-white meelio-mb-4 meelio-leading-tight meelio-whitespace-pre-line">
            {message.text}
          </h1>

          {/* Quote */}
          <div className="meelio-space-y-2">
            <p className="meelio-text-white/90">"{message.reminder}"</p>
            <p className="meelio-text-white/70 meelio-text-sm">
              - {message.author}
            </p>
          </div>

          {/* Stats */}
          <div className="meelio-mt-6 meelio-space-y-2 meelio-text-white/80">
            <p className="meelio-flex meelio-items-center meelio-justify-center meelio-gap-2">
              <span className="meelio-text-blue-300">💎</span> {siteName}{" "}
              Blocked: 4x Today
            </p>
            <p className="meelio-flex meelio-items-center meelio-justify-center meelio-gap-2">
              <span>💻</span> Blocked by Session: Work Time
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
