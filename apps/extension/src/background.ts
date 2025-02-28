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
        }, 250);
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
      chrome.runtime.sendMessage({ type: 'RESET_COMPLETE' });
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