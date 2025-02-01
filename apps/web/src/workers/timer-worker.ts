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


function startTimer() {
  if (interval) return;
  
  state.isRunning = true;
  interval = setInterval(() => {
    state.timeLeft -= 1;
    
    if (state.timeLeft <= 0) {
      // Switch modes automatically
      state.mode = state.mode === 'focus' ? 'break' : 'focus';
      state.timeLeft = state.mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
    }
    
    postMessage({type: 'TICK', ...state});
  }, 1000);
}

function pauseTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  state.isRunning = false;
  postMessage({type: 'TICK', ...state});
}

function resetTimer() {
  pauseTimer();
  state.timeLeft = state.mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
  postMessage({type: 'TICK', ...state});
}

function setMode(mode: 'focus' | 'break') {
  state.mode = mode;
  state.timeLeft = state.mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
  postMessage({type: 'TICK', ...state});
}

self.onmessage = (event) => {
  switch (event.data.type) {
    case 'TICK':
      postMessage({type: 'TICK', ...state} );
      break;
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
      setMode(event.data.mode);
      break;

    default:
      return;
  }
}; 