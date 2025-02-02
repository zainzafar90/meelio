let interval: NodeJS.Timeout | null = null;
let currentStart = 0;
let currentDuration = 0;

function calculateRemaining() {
  return currentDuration - Math.floor((Date.now() - currentStart) / 1000);
}

self.onmessage = function(e) {
  const { type, payload } = e.data;
  
  switch(type) {
    case 'START':
      if (!interval) {
        currentStart = Date.now();
        currentDuration = payload.duration;
        
        interval = setInterval(() => {
          const remaining = calculateRemaining();
          
          if (remaining <= 0) {
            self.postMessage({ type: 'TICK', remaining });
            self.postMessage({ type: 'STAGE_COMPLETE' });
            clearInterval(interval!);
            interval = null;
          } else {
            self.postMessage({ type: 'TICK', remaining });
          }
        }, 1000);
      }
      break;

    case 'PAUSE':
      if (interval) {
        clearInterval(interval);
        interval = null;
        const remaining = calculateRemaining();
        self.postMessage({ 
          type: 'PAUSED',
          remaining
        });
        self.postMessage({
          type: 'PERSIST_REMAINING',
          remaining
        });
      }
      break;

    case 'RESET':
      if (interval) clearInterval(interval);
      interval = null;
      currentStart = 0;
      currentDuration = 0;
      break;

    case 'UPDATE_DURATION':
      currentDuration = payload.duration;
      if (interval) {
        currentStart = Date.now();
      }
      break;

    case 'FORCE_SYNC':
      currentDuration = payload.duration;
      currentStart = Date.now() - (currentDuration - payload.duration) * 1000;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      break;
  }
};