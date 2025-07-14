import { useEffect } from "react";

export default function Popup() {
    useEffect(() => {
        chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") })
    }, []);
    // NOTE: Empty div is required for the popup to work to open the extension when clicking the action icon
    return null;
}