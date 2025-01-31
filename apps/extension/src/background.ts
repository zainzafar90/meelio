let interval: NodeJS.Timeout | null = null;

const state = {
  isRunning: false,
  timeLeft: 25 * 60,
  mode: 'focus',
};


const FOCUS_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60;  // 5 minutes


function switchMode() {
  if (state.mode === "focus") {
    state.mode = "break";
  } else {
    state.mode = "focus";
  }
  state.timeLeft = state.mode === "focus" ? FOCUS_TIME : BREAK_TIME;

  // Auto-start the next session
  state.isRunning = true;
  interval = setInterval(() => {
    if (state.timeLeft > 0) {
      state.timeLeft--;
      if (state.timeLeft === 0) {
        state.isRunning = false;
        clearInterval(interval!);
        switchMode();
      }
    }
  }, 1000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "HEARTBEAT":
      sendResponse({ ...state });
      break;
    case "START":
      if (!state.isRunning) {
        state.isRunning = true;
        interval = setInterval(() => {
          if (state.timeLeft > 0) {
            state.timeLeft--;
            if (state.timeLeft === 0) {
              state.isRunning = false;
              clearInterval(interval!);
              switchMode();
            }
          }
        }, 1000);
      }
      sendResponse({ ...state });
      break;
    case "PAUSE":
      state.isRunning = false;
        if (interval) {
        clearInterval(interval);
        interval = null;
      }
      sendResponse(state);
      break;
    case "RESET":
      state.isRunning = false;
      state.timeLeft = state.mode === "focus" ? FOCUS_TIME : BREAK_TIME;
      sendResponse(state);
      break;
    default:
      sendResponse({ error: "Unknown message type" });
  }
  return true; // Keep message channel open for async response
});

// Reset timer when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
    state.isRunning = false;
    state.timeLeft = FOCUS_TIME;
    state.mode = "focus";
}); 