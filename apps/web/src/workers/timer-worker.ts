let interval: NodeJS.Timeout | null = null;
let endTime = 0;
let currentDuration = 0;

function calculateRemaining() {
  return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
}

self.onmessage = function (e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      if (!interval) {
        currentDuration = payload.duration;
        endTime = Date.now() + (currentDuration * 1000);

        self.postMessage({ type: 'TICK', remaining: currentDuration });
        interval = setInterval(() => {
          const remaining = calculateRemaining();

          if (remaining <= 0) {
            self.postMessage({ type: 'TICK', remaining: 0 });
            self.postMessage({ type: 'STAGE_COMPLETE' });
            clearInterval(interval!);
            interval = null;
          } else {
            self.postMessage({ type: 'TICK', remaining });
          }
        }, 250);
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

      }
      break;

    case 'RESET':
      if (interval) clearInterval(interval);
      interval = null;
      endTime = 0;
      currentDuration = 0;
      break;

    case 'UPDATE_DURATION':
      currentDuration = payload.duration;
      if (interval) {
        endTime = Date.now() + (currentDuration * 1000);
      }
      break;

    // case 'FORCE_SYNC':
    //   currentDuration = payload.duration;
    //   endTime = Date.now() + (payload.duration * 1000);
    //   if (interval) {
    //     clearInterval(interval);
    //     interval = null;
    //   }
    //   break;
  }
};