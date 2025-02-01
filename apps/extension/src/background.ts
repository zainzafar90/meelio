let interval: NodeJS.Timeout | null = null;

// 25 minutes
const FOCUS_TIME = 25 * 60;
// 5 minutes
const BREAK_TIME = 5 * 60;

const state = {
  isRunning: false,
  timeLeft: FOCUS_TIME,
  mode: 'focus',
};


function startTimer(sendResponse: (response: any) => void) {
  if (interval) return;
  
  state.isRunning = true;
  interval = setInterval(() => {
    state.timeLeft -= 1;

    if (state.timeLeft <= 0) {
      // Switch modes automatically
      state.mode = state.mode === 'focus' ? 'break' : 'focus';
      state.timeLeft = state.mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
    }

    sendResponse({ type: 'TICK', ...state });
  }, 1000);
}

function pauseTimer(sendResponse: (response: any) => void) {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  state.isRunning = false;
  sendResponse({ type: 'TICK', ...state });
}

function resetTimer(sendResponse: (response: any) => void) {
  pauseTimer(sendResponse);
  state.timeLeft = state.mode === "focus" ? FOCUS_TIME : BREAK_TIME;
  sendResponse({ type: 'TICK', ...state });
}

function setMode(sendResponse: (response: any) => void, mode: 'focus' | 'break') {
  state.mode = mode;
  state.timeLeft = state.mode === "focus" ? FOCUS_TIME : BREAK_TIME;
  sendResponse({ type: 'TICK', ...state });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "TICK":
      sendResponse({ type: 'TICK', ...state });
      break;
    case "START":
      startTimer(sendResponse);
      break;
    case "PAUSE":
      pauseTimer(sendResponse);
      break;
    case "RESET":
      resetTimer(sendResponse);
      break;
    case "SET_MODE":
      setMode(sendResponse, message.mode);
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