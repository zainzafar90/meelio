interface TimerState {
    isRunning: boolean;
    timeLeft: number;
    mode: "focus" | "break";
    totalTime: number;
    cycleCount: number;
}


type Timer = {
  timeLeft: number
  initialTime: number
  isRunning: boolean
  mode: 'focus' | 'break'
  cycleCount: number
  intervalId?: ReturnType<typeof setInterval>
}

const FOCUS_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60;  // 5 minutes
let timer: Timer = {
  timeLeft: FOCUS_TIME,
  initialTime: FOCUS_TIME,
  isRunning: false,
  mode: 'focus',
  cycleCount: 1
};
function switchMode() {
  if (timer.mode === "focus") {
    timer.mode = "break";
  } else {
    timer.mode = "focus";
    timer.cycleCount++;
  }
  timer.initialTime = timer.mode === "focus" ? FOCUS_TIME : BREAK_TIME;
  timer.timeLeft = timer.initialTime;

  // Auto-start the next session
  timer.isRunning = true;
  timer.intervalId = setInterval(() => {
    if (timer.timeLeft > 0) {
      timer.timeLeft--;
      if (timer.timeLeft === 0) {
        timer.isRunning = false;
        clearInterval(timer.intervalId);
        switchMode();
      }
    }
  }, 1000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_TIME":
      sendResponse({ ...timer });
      break;
    case "START_TIMER":
      if (!timer.isRunning) {
        timer.isRunning = true;
        timer.intervalId = setInterval(() => {
          if (timer.timeLeft > 0) {
            timer.timeLeft--;
            if (timer.timeLeft === 0) {
              timer.isRunning = false;
              clearInterval(timer.intervalId);
              switchMode();
            }
          }
        }, 1000);
      }
      sendResponse({ ...timer });
      break;
    case "PAUSE_TIMER":
      timer.isRunning = false;
      if (timer.intervalId) {
        clearInterval(timer.intervalId);
      }
      sendResponse(timer);
      break;
    default:
      sendResponse({ error: "Unknown message type" });
  }
  return true; // Keep message channel open for async response
});

// Reset timer when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  timer = {
    timeLeft: FOCUS_TIME,
    initialTime: FOCUS_TIME,
    isRunning: false,
    mode: "focus",
    cycleCount: 1
  };
}); 