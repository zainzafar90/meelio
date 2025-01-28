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

function getInitialState(): TimerState {
  return {
    targetEndTime: null,
    currentMode: "focus",
    isPaused: true,
    pausedTimeRemaining: FOCUS_TIME,
    cycleCount: 1,
    duration: FOCUS_TIME,
  };
}

function loadSavedState(savedState: TimerState | null): TimerState {
  if (!savedState) return getInitialState();

  // If there was a running timer, calculate the correct remaining time
  if (!savedState.isPaused && savedState.targetEndTime) {
    const now = Date.now();
    if (now > savedState.targetEndTime) {
      // Timer would have completed, keep mode and cycle count
      return {
        ...savedState,
        targetEndTime: null,
        isPaused: true,
        pausedTimeRemaining: getDurationForMode(savedState.currentMode),
        duration: getDurationForMode(savedState.currentMode),
      };
    }
    // Timer is still running, calculate remaining time
    const remaining = Math.max(
      0,
      Math.floor((savedState.targetEndTime - now) / 1000)
    );
    return {
      ...savedState,
      pausedTimeRemaining: remaining,
      duration: getDurationForMode(savedState.currentMode),
    };
  }

  // For paused timer, ensure duration is correct
  return {
    ...savedState,
    duration: getDurationForMode(savedState.currentMode),
  };
}

// Initialize with default state
let state: TimerState = getInitialState();

// Request saved state from main thread
self.postMessage({ type: "GET_SAVED_STATE" });

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

  // Save state through main thread
  self.postMessage({ type: "SAVE_STATE", state });

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

  const stateUpdate = {
    timeLeft,
    isRunning: !state.isPaused,
    mode: state.currentMode,
    cycleCount: state.cycleCount,
  };

  // Send state update to main thread
  self.postMessage({ type: "STATE_UPDATE", state: stateUpdate });

  // Also save state
  self.postMessage({ type: "SAVE_STATE", state });

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
  }, 1000); // Update every second
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
    self.postMessage({ type: "SAVE_STATE", state });
    startUpdateInterval();
  }
}

function pauseTimer() {
  console.log("[Timer] Pausing timer");
  if (!state.isPaused) {
    state.isPaused = true;
    state.pausedTimeRemaining = getCurrentTimeRemaining();
    stopUpdateInterval();
    self.postMessage({ type: "SAVE_STATE", state });
    broadcastState();
  }
}

function resetTimer() {
  console.log("[Timer] Resetting timer");
  stopUpdateInterval();
  state = getInitialState();
  self.postMessage({ type: "SAVE_STATE", state });
  broadcastState();
}

// Message handler
self.addEventListener("message", (e: MessageEvent) => {
  console.log("[Timer] Received message:", e.data);
  switch (e.data.type) {
    case "LOAD_SAVED_STATE":
      if (e.data.state) {
        console.log("[Timer] Loading saved state:", e.data.state);
        state = loadSavedState(e.data.state);
        console.log("[Timer] State after loading:", state);
        if (!state.isPaused) {
          // If timer was running, calculate new end time and start
          state.targetEndTime =
            Date.now() + (state.pausedTimeRemaining ?? state.duration) * 1000;
          startUpdateInterval();
        } else {
          broadcastState();
        }
      }
      break;

    case "SYNC_STATE":
      if (e.data.state) {
        state = loadSavedState(e.data.state);
        if (!state.isPaused) {
          startUpdateInterval();
        } else {
          stopUpdateInterval();
          broadcastState();
        }
      }
      break;

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
