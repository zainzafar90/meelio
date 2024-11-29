import cssText from "data-text:@/style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

import Blocker from "./features/blocker"
import { getCustomBlockerMessage } from "./utils/site.utils"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const getBlockedSites = () => {
  const blockedSites = [
    "https://www.youtube.com",
    "https://www.facebook.com",
    "https://www.instagram.com"
  ]

  return blockedSites.map((site) => new URL(site).hostname.replace("www.", ""))
}

const PlasmoOverlay = () => {
  const [currentSite, setCurrentSite] = useState<string | undefined>()
  const [message, setMessage] = useState<any>()

  useEffect(() => {
    const sites = getBlockedSites()
    const currentSite = sites.find((site) =>
      window.location.href.includes(site)
    )

    if (currentSite) {
      setMessage(getCustomBlockerMessage())
      setCurrentSite(currentSite)
    } else {
      setMessage(null)
    }
  }, [])

  if (!currentSite || !message) return null

  return <Blocker message={message} siteName={currentSite} />
}

export default PlasmoOverlay
