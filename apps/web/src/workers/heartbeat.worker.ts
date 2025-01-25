let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let startTime: number | null = null;
let elapsedTime = 0;

self.onmessage = (e: MessageEvent) => {
  const { type } = e.data;

  switch (type) {
    case "start":
      if (!startTime) {
        startTime = Date.now() - elapsedTime;
      }
      if (!heartbeatInterval) {
        heartbeatInterval = setInterval(() => {
          const currentTime = Date.now();
          elapsedTime = currentTime - startTime!;
          self.postMessage({ type: "heartbeat", elapsed: elapsedTime });
        }, 100);
      }
      break;

    case "stop":
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      startTime = null;
      break;

    case "reset":
      elapsedTime = 0;
      startTime = null;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      self.postMessage({ type: "heartbeat", elapsed: 0 });
      break;
  }
}; 