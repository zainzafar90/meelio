import { TimerState } from "@repo/shared";

const FOCUS_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60;  // 5 minutes

interface TimerBackgroundState extends TimerState {
  cycleCount: number;
  intervalId?: number;
}

let timer: TimerBackgroundState = {
  timeLeft: FOCUS_TIME,
  totalTime: FOCUS_TIME,
  isRunning: false,
  mode: 'focus',
  cycleCount: 1
};

function switchMode() {
  timer.mode = timer.mode === 'focus' ? 'break' : 'focus';
  if (timer.mode === 'focus') {
    timer.cycleCount++;
  }
  
  timer.totalTime = timer.mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
  timer.timeLeft = timer.totalTime;
  
  notifyTimerUpdate();
  showNotification();
}

function showNotification() {
//   chrome.notifications.create({
//     type: 'basic',
//     iconUrl: '/icon-128.png',
//     title: timer.mode === 'focus' ? 'Focus Time!' : 'Break Time!',
//     message: timer.mode === 'focus' 
//       ? 'Time to focus on your work' 
//       : 'Time for a break!',
//     silent: false
//   });
}

function notifyTimerUpdate() {
  chrome.runtime.sendMessage({
    type: 'TIMER_UPDATE',
    state: getTimerState()
  });
}

function getTimerState(): TimerState {
  const { intervalId, cycleCount, ...state } = timer;
  return state;
}

function startTimer() {
  if (timer.intervalId) return;

  timer.isRunning = true;
  timer.intervalId = setInterval(() => {
    timer.timeLeft--;
    
    if (timer.timeLeft <= 0) {
      clearInterval(timer.intervalId);
      timer.intervalId = undefined;
      timer.isRunning = false;
      switchMode();
      startTimer(); // Auto-start next session
    }
    
    notifyTimerUpdate();
  }, 1000) as unknown as number;
  
  notifyTimerUpdate();
}

function pauseTimer() {
  if (timer.intervalId) {
    clearInterval(timer.intervalId);
    timer.intervalId = undefined;
  }
  timer.isRunning = false;
  notifyTimerUpdate();
}

function resetTimer() {
  pauseTimer();
  timer.timeLeft = timer.totalTime;
  notifyTimerUpdate();
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_TIMER_STATE':
      sendResponse(getTimerState());
      break;
      
    case 'START_TIMER':
      startTimer();
      sendResponse(getTimerState());
      break;
      
    case 'PAUSE_TIMER':
      pauseTimer();
      sendResponse(getTimerState());
      break;
      
    case 'RESET_TIMER':
      resetTimer();
      sendResponse(getTimerState());
      break;
      
    case 'SET_MODE':
      timer.mode = message.mode;
      timer.totalTime = timer.mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
      timer.timeLeft = timer.totalTime;
      notifyTimerUpdate();
      sendResponse(getTimerState());
      break;
  }
  return true; // Keep message channel open for async response
});

// Reset timer when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  timer = {
    timeLeft: FOCUS_TIME,
    totalTime: FOCUS_TIME,
    isRunning: false,
    mode: 'focus',
    cycleCount: 1
  };
}); 