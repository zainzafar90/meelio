let interval: ReturnType<typeof setInterval> | null = null;
let remaining = 0;

function startTimer(duration: number) {
  remaining = duration;
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    if (remaining > 0) {
      remaining -= 1;
      chrome.runtime.sendMessage({ type: "tick", remaining });
    }
    if (remaining <= 0) {
      clearInterval(interval!);
      interval = null;
      chrome.runtime.sendMessage({ type: "complete" });
    }
  }, 1000);
}

function pauseTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

function resumeTimer() {
  if (!interval && remaining > 0) {
    startTimer(remaining);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background received:", message);
  switch (message.type) {
    case "start":
        startTimer(message.duration);
      break;
    case "pause":
      pauseTimer();
      break;
    case "resume":
      resumeTimer();
      break;
    case "reset":
      pauseTimer();
      remaining = 0;
      break;
    default:
      sendResponse({ error: "Unknown message type" });
  }
  sendResponse({ success: true });
  return true; // Keep message channel open for async response
});

// Reset timer when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  if (interval) clearInterval(interval);
  interval = null;
  remaining = 0;
}); 