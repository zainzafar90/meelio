let interval: number | null = null;
const state = {
  isRunning: false,
  timeLeft: 25 * 60,
  mode: 'focus',
  totalTime: 25 * 60
};

const FOCUS_TIME = 25 * 60; // 25 minutes in seconds
const BREAK_TIME = 5 * 60;  // 5 minutes in seconds
function startTimer() {
  if (interval) return;
  
  state.isRunning = true;
  interval = setInterval(() => {
    state.timeLeft -= 1;
    
    if (state.timeLeft <= 0) {
      // Switch modes automatically
      state.mode = state.mode === 'focus' ? 'break' : 'focus';
      state.totalTime = state.mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
      state.timeLeft = state.totalTime;
    }
    
    postMessage(state);
  }, 100) as unknown as number;
}
function pauseTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  state.isRunning = false;
  postMessage(state);
}
function resetTimer() {
  pauseTimer();
  state.timeLeft = state.totalTime;
  postMessage(state);
}
self.onmessage = (event) => {
  switch (event.data.type) {
    case 'START':
      startTimer();
      break;
    case 'PAUSE':
      pauseTimer();
      break;
    case 'RESET':
      resetTimer();
      break;
    case 'SET_MODE':
      state.mode = event.data.mode;
      state.totalTime = state.mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
      state.timeLeft = state.totalTime;
      postMessage(state);
      break;
  }
}; 