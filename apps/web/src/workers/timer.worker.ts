// worker.js
let interval: NodeJS.Timeout;
let elapsed = 0;
let duration: number;
let running = false;

function startTimer() {
  if (!running) {
    running = true;
    interval = setInterval(() => {
      elapsed += 1;
      postMessage({ type: "tick", elapsed });
      if (elapsed >= duration) {
        postMessage({ type: "stage-completed" });
        clearInterval(interval);
        running = false;
      }
    }, 1000);
  }
}

function pauseTimer() {
  if (running) {
    clearInterval(interval);
    running = false;
  }
}

function resumeTimer() {
  if (!running) {
    running = true;
    interval = setInterval(() => {
      elapsed += 1;
      postMessage({ type: "tick", elapsed });
      if (elapsed >= duration) {
        postMessage({ type: "stage-completed" });
        clearInterval(interval);
        running = false;
      }
    }, 1000);
  }
}

self.addEventListener("message", (e) => {
  const { command, newDuration } = e.data;
  switch (command) {
    case "start":
      duration = newDuration;
      elapsed = 0;
      startTimer();
      break;
    case "pause":
      console.log("paused");
      pauseTimer();
      break;
    case "resume":
      console.log("paused");
      resumeTimer();
      break;
  }
});
