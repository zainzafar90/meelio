// let interval: ReturnType<typeof setInterval> | null = null;
// let remaining = 0;
// function startTimer(duration: number) {
//   remaining = duration;
//   if (interval) clearInterval(interval);
//   interval = setInterval(() => {
//     remaining -= 1;
//     self.postMessage({ type: "tick", remaining });
//     if (remaining <= 0) {
//       clearInterval(interval!);
//       interval = null;
//       self.postMessage({ type: "complete" });
//     }
//   }, 100);
// }
// function pauseTimer() {
//   if (interval) {
//     clearInterval(interval);
//     interval = null;
//   }
// }
// function resumeTimer() {
//   if (!interval) {
//     startTimer(remaining);
//   }
// }
// self.addEventListener("message", (e: MessageEvent) => {
//   switch (e.data.command) {
//     case "start":
//       startTimer(e.data.duration);
//       break;
//     case "pause":
//       pauseTimer();
//       break;
//     case "resume":
//       resumeTimer();
//       break;
//   }
// });
// export {};