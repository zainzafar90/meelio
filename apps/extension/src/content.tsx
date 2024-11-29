import cssText from "data-text:@/style.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

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

const getCurrentSite = () => {
  return new URL(window.location.href).hostname
}

const isBlockedSite = (blockedSites: string[]) => {
  const currentSite = getCurrentSite()
  return blockedSites.some((site) => currentSite.includes(site))
}

const PlasmoOverlay = () => {
  const [blockedSites] = useStorage<string[]>(
    {
      key: "blockedSites",
      instance: new Storage({
        area: "local"
      })
    },
    []
  )
  const [message, setMessage] = useState<any>()
  const currentSite = getCurrentSite()

  useEffect(() => {
    ;(async () => {
      const isBlocked = isBlockedSite(blockedSites)

      if (isBlocked) {
        setMessage(getCustomBlockerMessage())
      } else {
        setMessage(null)
      }
    })()
  }, [blockedSites])

  if (!currentSite || !message) return null

  return <Blocker message={message} siteName={currentSite} />
}

export default PlasmoOverlay
