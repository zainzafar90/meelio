// Timer worker implementation
const timerWorker = {
  timerId: null as NodeJS.Timeout | null,

  onmessage: (e: { data: { type: string; duration?: number } }) => {
    switch (e.data.type) {
      case "START":
        if (e.data.duration) {
          timerWorker.startTimer(e.data.duration);
        }
        break;
      case "STOP":
        timerWorker.stopTimer();
        break;
    }
  },

  startTimer(duration: number) {
    this.stopTimer();
    this.timerId = setInterval(() => {
      // @ts-ignore - postMessage exists in both environments
      postMessage({ type: "TICK" });
    }, 1000);

    setTimeout(() => {
      this.stopTimer();
      // @ts-ignore - postMessage exists in both environments
      postMessage({ type: "COMPLETE" });
    }, duration * 1000);
  },

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  },
};

if (typeof chrome !== "undefined" && chrome.runtime) {
  // Chrome extension environment
  // @ts-ignore - Chrome specific
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    timerWorker.onmessage({ data: message });
  });
} else {
  // Handle both Web Worker and Chrome extension environments
  // Web Worker environment
  self.onmessage = timerWorker.onmessage;
}

export default {};
