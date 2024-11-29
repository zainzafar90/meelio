import { type BlockedSite } from "@/config/sites"

interface BlockerProps {
  siteName: string
  message: BlockedSite | null
}

export default function Blocker({ siteName, message }: BlockerProps) {
  const getThemeClasses = (theme: string) => {
    const themes = {
      red: "plasmo-bg-red-950",
      green: "plasmo-bg-green-950",
      purple: "plasmo-bg-purple-950",
      teal: "plasmo-bg-teal-950",
      amber: "plasmo-bg-amber-950"
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
      className={`plasmo-fixed plasmo-inset-0 plasmo-z-[999999999] plasmo-w-screen plasmo-h-screen ${themeClass} plasmo-overflow-hidden plasmo-p-8 plasmo-shadow-xl plasmo-cursor-pointer plasmo-transition-colors plasmo-duration-300 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-flex-1`}>
      <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-h-full plasmo-w-full plasmo-max-w-md plasmo-mx-auto">
        <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-text-center plasmo-gap-8">
          {/* Emoji */}
          <div className="plasmo-text-6xl plasmo-mb-4">{message.mainEmoji}</div>

          {/* Title */}
          <h1 className="plasmo-text-3xl plasmo-font-semibold plasmo-text-white plasmo-mb-4 plasmo-leading-tight plasmo-whitespace-pre-line">
            {message.text}
          </h1>

          {/* Quote */}
          <div className="plasmo-space-y-2">
            <p className="plasmo-text-white/90">"{message.reminder}"</p>
            <p className="plasmo-text-white/70 plasmo-text-sm">
              - {message.author}
            </p>
          </div>

          {/* Stats */}
          <div className="plasmo-mt-6 plasmo-space-y-2 plasmo-text-white/80">
            <p className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2">
              <span className="plasmo-text-blue-300">💎</span> {siteName}{" "}
              Blocked: 4x Today
            </p>
            <p className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2">
              <span>💻</span> Blocked by Session: Work Time
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="plasmo-w-full plasmo-bg-white/90 hover:plasmo-bg-white plasmo-text-gray-900 plasmo-rounded-full plasmo-py-3 plasmo-font-medium plasmo-transition-colors plasmo-mt-4 plasmo-max-w-64">
            {message.buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}
