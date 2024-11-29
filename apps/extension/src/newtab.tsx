import { useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

export default function NewTab() {
  const [siteInput, setSiteInput] = useState("")
  const [blockedSites, setBlockedSites] = useStorage<string[]>(
    {
      key: "blockedSites",
      instance: new Storage({
        area: "local"
      })
    },
    []
  )

  const addSite = async () => {
    const site = siteInput.trim()
    if (!site) return

    if (!blockedSites.includes(site)) {
      setBlockedSites([...blockedSites, site])
      setSiteInput("")
    }
  }

  const deleteSite = async (site: string) => {
    const sites = blockedSites.filter((s) => s !== site)
    setBlockedSites(sites)
  }

  return (
    <div className="p-4 font-sans">
      <h2 className="text-2xl mb-4">Site Blocker</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={siteInput}
          onChange={(e) => setSiteInput(e.target.value)}
          placeholder="Enter site URL"
          className="border p-2 rounded"
        />
        <button
          onClick={addSite}
          className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Site
        </button>
      </div>
      <ul className="mt-4">
        {blockedSites.map((site) => (
          <li key={site} className="flex items-center gap-2 my-2">
            <span>{site}</span>
            <button
              onClick={() => deleteSite(site)}
              className="bg-red-500 text-white px-2 py-1 rounded text-sm">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
