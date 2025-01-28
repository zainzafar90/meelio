interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  mode: "focus" | "break";
  totalTime: number;
}


const FOCUS_TIME = 25 * 60; // 25 minutes
const SHORT_BREAK_TIME = 5 * 60; // 5 minutes
const LONG_BREAK_TIME = 15 * 60; // 15 minutes
const CYCLES_BEFORE_LONG_BREAK = 4;

type Timer = {
  timeLeft: number;
  initialTime: number;
  isRunning: boolean;
  mode: 'focus' | 'break';
  cycleCount: number;
  intervalId?: ReturnType<typeof setInterval>;
};

let timer: Timer = {
  timeLeft: FOCUS_TIME,
  initialTime: FOCUS_TIME,
  isRunning: false,
  mode: 'focus',
  cycleCount: 1
};

function getNextBreakDuration() {
  return timer.cycleCount % CYCLES_BEFORE_LONG_BREAK === 0 
    ? LONG_BREAK_TIME 
    : SHORT_BREAK_TIME;
}

function switchMode() {
  if (timer.mode === "focus") {
    timer.mode = "break";
    timer.initialTime = getNextBreakDuration();
  } else {
    timer.mode = "focus";
    timer.initialTime = FOCUS_TIME;
    timer.cycleCount++;
  }
  timer.timeLeft = timer.initialTime;
  startTimer(); // Auto-start next session
}

function startTimer() {
  if (timer.intervalId) {
    clearInterval(timer.intervalId);
  }

  timer.isRunning = true;
  timer.intervalId = setInterval(() => {
    if (timer.timeLeft > 0) {
      timer.timeLeft--;
      broadcastState();
      
      if (timer.timeLeft === 0) {
        timer.isRunning = false;
        clearInterval(timer.intervalId);
        switchMode();
      }
    }
  }, 1000);
}

function pauseTimer() {
  timer.isRunning = false;
  if (timer.intervalId) {
    clearInterval(timer.intervalId);
    timer.intervalId = undefined;
  }
  broadcastState();
}

function resetTimer() {
  pauseTimer();
  timer = {
    timeLeft: FOCUS_TIME,
    initialTime: FOCUS_TIME,
    isRunning: false,
    mode: 'focus',
    cycleCount: 1
  };
  broadcastState();
}

function broadcastState() {
  chrome.runtime.sendMessage({ 
    type: "STATE_UPDATE",
    state: { 
      timeLeft: timer.timeLeft,
      isRunning: timer.isRunning,
      mode: timer.mode,
      cycleCount: timer.cycleCount
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_TIME":
      sendResponse({ 
        timeLeft: timer.timeLeft,
        isRunning: timer.isRunning,
        mode: timer.mode,
        cycleCount: timer.cycleCount
      });
      break;

    case "START_TIMER":
      if (!timer.isRunning) {
        startTimer();
      }
      sendResponse({ success: true });
      break;

    case "PAUSE_TIMER":
      pauseTimer();
      sendResponse({ success: true });
      break;

    case "RESET_TIMER":
      resetTimer();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }
  return true; // Keep message channel open for async response
});

// Reset timer when extension is installed/updated
chrome.runtime.onInstalled.addListener(resetTimer); 