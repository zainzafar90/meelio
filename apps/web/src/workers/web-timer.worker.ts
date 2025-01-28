// Timer durations in seconds
const FOCUS_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;
const CYCLES_BEFORE_LONG_BREAK = 4;

type TimerMode = "focus" | "short-break" | "long-break";

interface TimerState {
  targetEndTime: number | null; // Timestamp when timer should end
  currentMode: TimerMode;
  isPaused: boolean;
  pausedTimeRemaining: number | null;
  cycleCount: number;
  duration: number; // Current duration in seconds
}

let updateInterval: ReturnType<typeof setInterval> | null = null;

// Initial state
let state: TimerState = {
  targetEndTime: null,
  currentMode: "focus",
  isPaused: true,
  pausedTimeRemaining: FOCUS_TIME,
  cycleCount: 1,
  duration: FOCUS_TIME,
};

function getCurrentTimeRemaining(): number {
  if (state.isPaused && state.pausedTimeRemaining !== null) {
    return state.pausedTimeRemaining;
  }

  if (!state.targetEndTime) {
    return state.duration;
  }

  const remaining = Math.max(
    0,
    Math.floor((state.targetEndTime - Date.now()) / 1000)
  );
  return remaining;
}

function getNextMode(): TimerMode {
  if (state.currentMode === "focus") {
    return state.cycleCount % CYCLES_BEFORE_LONG_BREAK === 0
      ? "long-break"
      : "short-break";
  }
  return "focus";
}

function getDurationForMode(mode: TimerMode): number {
  switch (mode) {
    case "focus":
      return FOCUS_TIME;
    case "short-break":
      return SHORT_BREAK_TIME;
    case "long-break":
      return LONG_BREAK_TIME;
  }
}

function switchMode() {
  console.log("[Timer] Switching mode");
  const nextMode = getNextMode();
  state.currentMode = nextMode;
  state.duration = getDurationForMode(nextMode);

  if (state.currentMode === "focus") {
    state.cycleCount++;
  }

  // Auto-start next session
  startTimer();
}

function broadcastState() {
  const timeLeft = getCurrentTimeRemaining();
  console.log("[Timer] Broadcasting state:", {
    timeLeft,
    isRunning: !state.isPaused,
    mode: state.currentMode,
    cycleCount: state.cycleCount,
    targetEndTime: state.targetEndTime,
  });

  self.postMessage({
    type: "STATE_UPDATE",
    state: {
      timeLeft,
      isRunning: !state.isPaused,
      mode: state.currentMode,
      cycleCount: state.cycleCount,
    },
  });

  // Check if timer completed
  if (timeLeft === 0 && !state.isPaused) {
    console.log("[Timer] Timer completed");
    stopUpdateInterval();
    switchMode();
  }
}

function startUpdateInterval() {
  console.log("[Timer] Starting update interval");
  stopUpdateInterval();

  // Update immediately
  broadcastState();

  // Then update every second
  updateInterval = setInterval(() => {
    const timeLeft = getCurrentTimeRemaining();

    // If timer completed
    if (timeLeft === 0 && !state.isPaused) {
      console.log("[Timer] Timer completed in interval");
      stopUpdateInterval();
      switchMode();
      return;
    }

    broadcastState();
  }, 1000); // Update every second instead of 100ms
}

function stopUpdateInterval() {
  if (updateInterval) {
    console.log("[Timer] Stopping update interval");
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

function startTimer() {
  console.log("[Timer] Starting timer", { state });
  if (state.isPaused) {
    const timeToRun = state.pausedTimeRemaining ?? state.duration;
    state.targetEndTime = Date.now() + timeToRun * 1000;
    state.isPaused = false;
    state.pausedTimeRemaining = null;
    startUpdateInterval();
  }
}

function pauseTimer() {
  console.log("[Timer] Pausing timer");
  if (!state.isPaused) {
    state.isPaused = true;
    state.pausedTimeRemaining = getCurrentTimeRemaining();
    stopUpdateInterval();
    broadcastState();
  }
}

function resetTimer() {
  console.log("[Timer] Resetting timer");
  stopUpdateInterval();
  state = {
    targetEndTime: null,
    currentMode: "focus",
    isPaused: true,
    pausedTimeRemaining: FOCUS_TIME,
    cycleCount: 1,
    duration: FOCUS_TIME,
  };
  broadcastState();
}

// Message handler
self.addEventListener("message", (e: MessageEvent) => {
  console.log("[Timer] Received message:", e.data);
  switch (e.data.type) {
    case "GET_STATE":
      broadcastState();
      break;

    case "START_TIMER":
      startTimer();
      break;

    case "PAUSE_TIMER":
      pauseTimer();
      break;

    case "RESET_TIMER":
      resetTimer();
      break;
  }
});

export {};
