// const PomodoroStage = {
//   Focus: 0,
//   Break: 1
// } as const;

// interface TimerState {
//   isRunning: boolean;
//   endTime: number;
//   currentDuration: number;
//   mode: 'focus' | 'break';
// }

// let timerState: TimerState = {
//   isRunning: false,
//   endTime: 0,
//   currentDuration: 0,
//   mode: 'focus'
// };

// let interval: NodeJS.Timeout | null = null;

// // Service worker safe storage operations
// async function getStorageState(): Promise<any> {
//   return new Promise(resolve => {
//     chrome.storage.local.get('pomodoroState', (result) => {
//       resolve(result.pomodoroState);
//     });
//   });
// }

// async function updateStorageState(partialState: Partial<TimerState>) {
//   const currentState = await getStorageState() || {};
//   const newState = { ...currentState, ...partialState };
//   chrome.storage.local.set({ pomodoroState: newState });
// }

// function startTimer() {
//   if (timerState.isRunning) return;
  
//   timerState.isRunning = true;
//   timerState.endTime = Date.now() + (timerState.currentDuration * 1000);
//   updateStorageState(timerState);

//   interval = setInterval(() => {
//     if (!timerState.isRunning) return;

//     const remaining = Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 1000));
    
//     chrome.runtime.sendMessage({
//       type: 'TICK',
//       endTime: timerState.endTime,
//       remaining,
//       mode: timerState.mode
//     });

//     if (remaining <= 0) {
//       timerState.isRunning = false;
//       chrome.runtime.sendMessage({ type: 'STAGE_COMPLETE' });
//       clearInterval(interval!);
//       interval = null;
//       updateStorageState(timerState);
//     }
//   }, 1000);
// }

// // Initialize from storage
// chrome.storage.local.get('pomodoroState', (result) => {
//   if (result.pomodoroState) {
//     timerState = {
//       ...timerState,
//       ...result.pomodoroState,
//       mode: result.pomodoroState.activeStage === 0 ? 'focus' : 'break'
//     };
//   }
// });

// // Sync storage changes
// chrome.storage.onChanged.addListener((changes) => {
//   if (changes.pomodoroState) {
//     const newState = changes.pomodoroState.newValue;
//     console.log('newState', newState);
//     timerState = {
//       ...timerState,
//       currentDuration: newState.stageDurations?.[newState.activeStage === 0 ? 0 : 1] ?? 0,
//       mode: newState.activeStage === 0 ? 'focus' : 'break'
//     };
//   }
// });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   switch (message.type) {
//     case 'START':
//       timerState.currentDuration = message.duration;
//       startTimer();
//       break;
      
//     case 'PAUSE':
//       timerState.isRunning = false;
//       break;
      
//     case 'RESET':
//       timerState = {
//         isRunning: false,
//         endTime: 0,
//         currentDuration: 0,
//         mode: 'focus'
//       };
//       break;
      
//     case 'SET_MODE':
//       timerState = {
//         isRunning: false,
//         endTime: 0,
//         currentDuration: message.duration,
//         mode: message.mode === 'focus' ? 'focus' : 'break'
//       };
//       break;
      
//     case 'UPDATE_DURATION':
//       timerState.currentDuration = message.duration;
//       if (interval) {
//         timerState.endTime = Date.now() + (timerState.currentDuration * 1000);
//       }
//       break;
      
//     case 'STAGE_COMPLETE':
//       // Automatically start next stage if enabled
//       chrome.storage.local.get('pomodoroState', (result) => {
//         const storeState = result.pomodoroState;
//         if (storeState?.autoStartTimers) {
//           const nextStage = storeState.activeStage === 0 ? 1 : 0;
//           const duration = storeState.stageDurations[nextStage];
//           timerState = {
//             isRunning: true,
//             endTime: Date.now() + (duration * 1000),
//             currentDuration: duration,
//             mode: nextStage === 0 ? 'focus' : 'break'
//           };
//           startTimer();
//         }
//       });
//       break;
//   }
//   return true;
// });

// // Reset timer when extension is installed/updated
// chrome.runtime.onInstalled.addListener(() => {
//     timerState.isRunning = false;
//     timerState.currentDuration = 0;
//     timerState.mode = "focus";
// });

// // Add this periodic sync
// setInterval(() => {
//   if (timerState.isRunning) {
//     chrome.storage.local.set({ 
//       pomodoroState: {
//         ...timerState,
//         endTimestamp: timerState.endTime,
//         isRunning: timerState.isRunning
//       }
//     });
//   }
// }, 1000); 

let interval: NodeJS.Timeout | null = null;
let endTime = 0;
let currentDuration = 0;

function calculateRemaining() {
  return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START':
      if (!interval) {
        currentDuration = message.duration;
        endTime = Date.now() + (currentDuration * 1000);

        chrome.runtime.sendMessage({ type: 'TICK', remaining: currentDuration });
        interval = setInterval(() => {
          const remaining = calculateRemaining();

          if (remaining <= 0) {
            chrome.runtime.sendMessage({ type: 'TICK', remaining: 0 });
            chrome.runtime.sendMessage({ type: 'STAGE_COMPLETE' });
            clearInterval(interval!);
            interval = null;
          } else {
            chrome.runtime.sendMessage({ type: 'TICK', remaining });
          }
        }, 1000);
      }
      break;

    case 'PAUSE':
      if (interval) {
        clearInterval(interval);
        interval = null;
        const remaining = calculateRemaining();
        chrome.runtime.sendMessage({ type: 'PAUSED', remaining });
      } 
      break;

    case 'RESET':
      if (interval) clearInterval(interval);
      interval = null;
      endTime = 0;
      currentDuration = 0;
      break;

    case 'UPDATE_DURATION':
      currentDuration = message.duration;
      if (interval) {
        endTime = Date.now() + (currentDuration * 1000);
      }
      break;

    // case 'FORCE_SYNC':
    //   currentDuration = message.duration;
    //   endTime = Date.now() + (message.duration * 1000);
    //   if (interval) {
    //     clearInterval(interval);
    //     interval = null;
    //   }
    //   break;
      
  }
}); 

chrome.runtime.onInstalled.addListener(() => {
  interval = null;
  endTime = 0;
  currentDuration = 0;
}); 